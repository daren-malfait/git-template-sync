import * as chalk from 'chalk';
import { spawn } from 'child_process';
import * as inquirer from 'inquirer';

export interface Commit {
  message: string;
  hash: string;
  timestamp: number;
}

export interface Update {
  package: string;
  version: string;
}

export const git = (
  cmd: string,
  { noPager, verbose }: { noPager?: boolean; verbose?: boolean } = {
    noPager: false,
    verbose: false,
  },
): Promise<string> => {
  const gitCmd = `git${(noPager && ' --no-pager') || ''}`;

  return run(`${gitCmd} ${cmd}`, { verbose });
};

const run = (
  inputCommand: string,
  { verbose }: { verbose?: boolean } = { verbose: false },
): Promise<string> => {
  let output = '';
  const [cmd, ...args] = (
    inputCommand.match(
      /[A-z0-9\-_:/\\.@!#$%^&*(){}[\];<>=+~]+|"(?:[^"]|(?<=\\)")+"|'(?:[^']|(?<=\\)')+'/g,
    ) || []
  ).map(arg => arg.replace(/^"|"$|\\(?="|')/g, ''));

  const child = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'] });

  if (verbose) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  child.stdout.on('data', chunk => {
    output += chunk;
  });

  child.stderr.on('data', chunk => {
    output += chunk;
  });

  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code) {
        reject(output);
      } else {
        resolve(output);
      }
    });
  });
};

export const addRemote = async (
  remoteName: string,
  remoteUrl: string,
): Promise<boolean> => {
  return successful(() =>
    git(`remote add -f ${remoteName} ${remoteUrl} --no-tags`),
  );
};

export const removeRemote = async (remoteName: string): Promise<boolean> => {
  return successful(() => git(`remote remove ${remoteName}`));
};

export const getCurrentBranchName = async (): Promise<string> => {
  const branchOutput = await git(`branch`);

  return (branchOutput.match(/\*\s(\S+)/) as any)[1];
};

export const getUpdates = async (updateBranch: string): Promise<Commit[]> => {
  const currentBranch = await getCurrentBranchName();

  const currentHashes = (await git(`log ${currentBranch} --format=%h`))
    .trim()
    .split('\n');
  const currentBodies = (await git(`log ${currentBranch} --format=%b`))
    .trim()
    .split('\n');
  const currentDates = (await git(`log ${currentBranch} --format=%at`))
    .trim()
    .split('\n');
  const templateHashes = (await git(`log ${updateBranch} --format=%h`))
    .trim()
    .split('\n');
  const templateMessages = (await git(`log ${updateBranch} --format=%s`))
    .trim()
    .split('\n');
  const templateDates = (await git(`log ${updateBranch} --format=%at`))
    .trim()
    .split('\n');

  const forkDate = +currentDates[currentDates.length - 1];
  const afterFork = (commit: Commit) => commit.timestamp >= forkDate;
  const notApplied = (commit: Commit) =>
    currentBodies.findIndex(
      msg => msg.includes('upstream template:') && msg.includes(commit.hash),
    ) === -1 && currentHashes.findIndex(hash => hash === commit.hash) === -1;
  const updates = templateHashes
    .map(
      (hash, idx) =>
        ({
          hash,
          message: templateMessages[idx],
          timestamp: +templateDates[idx],
        } as Commit),
    )
    .filter(notApplied)
    .filter(afterFork);

  return updates;
};

export const successful = async (fn: () => any): Promise<boolean> => {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
};

export const applyUpdate = async (commit: Commit): Promise<void> => {
  const commitMessage = generateUpdateCommitMessage(commit);

  console.info(
    chalk.default
      .yellow`Stashing your current working directory before applying updates...`,
  );

  const { hash } = commit;

  const stashed = !(
    await git(`stash save Before applying upstream-template update ${hash}`, {
      verbose: true,
    })
  ).includes('No local changes');

  // If it's an update commit, don't attempt to merge with git, use package manager instead...
  const update = extractUpdateCommit(commit);

  if (update) {
    await successful(() =>
      run(`npm install ${update.package}@${update.version}`, { verbose: true }),
    );
    await successful(() => git(`add -u`, { verbose: true }));
  } else {
    await successful(() =>
      git(`cherry-pick -X ignore-all-space ${hash} --no-commit`),
    );
  }

  const successfullyCommits = async () => {
    try {
      await git(`commit -m "${commitMessage}"`, { verbose: true });

      return true;
    } catch (stderr) {
      return stderr.includes('working tree clean');
    }
  };

  while (!(await successfullyCommits())) {
    await inquirer.prompt({
      message: chalk.default
        .yellow`Resolve/stage conflicts and press any key to continue...`,
      name: 'value',
    });
  }

  if (stashed) {
    await git(`stash pop`, { verbose: true });
  }
};

const generateUpdateCommitMessage = ({ message, hash }: Commit): string => {
  return `${message.replace(
    /(["'$`\\])/g,
    '\\$1',
  )}\n\nupdate from upstream template: ${hash}`;
};

const extractUpdateCommit = ({ message }: Commit): Update | false => {
  const update = /Bump (\S+) from \S+ to (\S+)/g.exec(message);

  if (update) {
    return {
      package: update[1],
      version: update[2],
    };
  } else {
    return false;
  }
};

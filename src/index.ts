#!/usr/bin/env node
import * as inquirer from 'inquirer';
import yargs from 'yargs';

import dotenv from 'dotenv';
dotenv.config();

const argv = process.argv.slice(2);

import {
  addRemote,
  applyUpdate,
  Commit,
  getUpdates,
  removeRemote,
} from './git';

const sync = async ({
  branch,
  remoteUrl,
}: {
  branch: string;
  remoteUrl?: string;
}): Promise<number> => {
  const remoteName = 'template';

  if (!remoteUrl) {
    console.error(
      'Please provide a template-url by putting it in the environment file or passign it with --remoteUrl',
    );
    return 1;
  }

  await removeRemote(remoteName);

  if (await addRemote(remoteName, remoteUrl)) {
    const updates = await getUpdates(`${remoteName}/${branch}`);

    if (updates.length) {
      const { selection } = await inquirer.prompt<{ selection: Commit[] }>({
        choices: [
          new inquirer.Separator(),
          ...updates.map(commit => ({
            name: commit.message,
            value: commit,
          })),
        ],
        name: 'selection',
        type: 'checkbox',
      });

      const updateSet = selection.sort(
        (commitA, commitB) => commitA.timestamp - commitB.timestamp,
      );

      for (const update of updateSet) {
        await applyUpdate(update);
      }
    } else {
      console.log(`There are no new updates from upstream template repository`);
    }
  } else {
    console.log(`Unable to add remote repository with url: ${remoteUrl}`);
    await removeRemote(remoteName);
    return 1;
  }

  await removeRemote(remoteName);

  return 0;
};

const run = async () => {
  const options = yargs
    .strict(true)
    .scriptName('git-template-sync')
    .example('$0', 'Fetch the commits of a template repository.')
    .example(
      '$0 --remoteUrl <remoteUrl>',
      ['Passing the remote url as a parameter'].join(' '),
    )
    .example(
      '$0 --branch <branch>',
      ['Set a different branch to use'].join(' '),
    )
    .options({
      remoteUrl: {
        alias: 'r',
        describe: 'remote repo url of the template',
        type: 'string',
        default: process.env.TEMPLATE_PATH,
      },
      branch: {
        alias: 'b',
        describe: 'Branch of the remote which should be checked',
        type: 'string',
        default: 'main',
      },
      version: {
        alias: 'v',
      },
      help: {
        alias: 'h',
      },
    })
    .parse(argv);

  try {
    await sync(options);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();

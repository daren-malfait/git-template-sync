<div align="center">
<h1>git-template-sync</h1>

<p>Cherry picking updates from upstream template. Based on <a href="https://github.com/rioam2/git-upstream-template"/>rioam2/git-upstream-template</a></p>
</div>

---

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![version][version-badge]][package]
[![MIT License][license-badge]][license]
<!-- prettier-ignore-end -->

## The problem

The github template functionlity is useful, but it lacks a way to get updates when the template repository gets updates. The repo from rioam2 works, but it breaks convential commits.

## This solution

I used a lot of rioam2's code to start this package. Refactoring it and adding my way of working.


## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module should be installed as one of your project's `devDependencies`:

```
npm install --save-dev git-template-sync
```

## Usage

as default git-template-sync looks for TEMPLATE_PATH in .env

```s
git-template-sync

# you can pass the remoteUrl as a param
git-template-sync --remoteUrl <remoteUrl>

# as default git-template-sync uses main as the branch to fetch.
git-template-sync --branch <branch>
```

## License
MIT

<!-- prettier-ignore-start -->
[npm]: https://www.npmjs.com
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/github/workflow/status/daren-malfait/git-template-sync/CI?logo=github&style=flat-square
[build]: https://github.com/daren-malfait/git-template-sync/actions?query=workflow
[version-badge]: https://img.shields.io/npm/v/git-template-sync.svg?style=flat-square
[package]: https://www.npmjs.com/package/git-template-sync
[downloads-badge]: https://img.shields.io/npm/dm/git-template-sync.svg?style=flat-square
[license-badge]: https://img.shields.io/npm/l/git-template-sync.svg?style=flat-square
[license]: https://github.com/daren-malfait/git-template-sync/blob/main/LICENSE
<!-- prettier-ignore-end -->
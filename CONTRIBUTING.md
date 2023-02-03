# Contributing to ngx-theme-manager

We are really glad you've decided to contribute to this project ✌

As a contributor, here are the guidelines we'd like you to follow:

- [Code of conduct](#code-of-conduct)
- [How can I contribute?](#how-can-i-contribute)
- [Using the issue tracker](#using-the-issue-tracker)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding rules](#coding-rules)
- [Working with the code](#working-with-the-code)

We also recommend reading [How to Contribute to Open Source][how-to-contribute]

## Code of conduct

We firmly believe that software development is an art and as such, having fun should always be a priority.
This, of course, can only be achieved if there is respect and tolerance among all parties involved.

Please read and follow the [Code of conduct](CODE_OF_CONDUCT.md)

## How can I contribute?

If you're new to GitHub issues, you might want to limit your search to [`label: "good first issue"][filter::first].

### Improve documentation

As a **user**, you're the perfect candidate to help us improve the documentation: typo corrections, clarifications,
recipes, etc.

Take a look at the [documentation issues that need help][filter::documentation]. Please follow
the [Documentation guidelines](#documentation).

### Give feedback on issues

Some issues are created without information requested in the [Bug report guideline](#bug-report). Help make them easier
to resolve by adding any relevant information.

Issues with the [discussion label][filter::discussion] are meant to discuss the implementation of new features.
Participating in the discussion is a good opportunity to get involved and influence the future direction of this
package.

### Fix bugs and implement features

Confirmed bugs and ready-to-implement features are marked with the [help wanted label][filter::help wanted]. Post a
comment on the issue to indicate you would like to work on it and to request help from
the [@rb-mwindh/ngx-theme-manager/maintainers][maintainers] and the community.

## Using the issue tracker

The issue tracker is the channel for [bug reports](#bug-report),
[feature requests](#feature-request) and [submitting pull requests](#submitting-a-pull-request).

Please use the [Get help](README.md#get-help) section for support, troubleshooting and questions.

Before opening an issue or a Pull Request, please use the [Github issue search][issues]
to make sure the bug or feature hasn't been already reported or fixed.

### Bug report

A good bug report shouldn't leave others needing to chase you for more information. Please try to be as detailed as
possible in your report and fill the information requested in the
[Bug report template][issue::bug].

### Feature request

Although we try really hard, we can't foresee all imaginable use cases. So if you say to yourself, "Wouldn't it be nice
if this package could...", then you should document this idea as quick as possible.

We invite you to submit your feature requests to our issue tracker. Please try to describe your idea as detailed as
possible. As a little help we have prepared a [Feature request template][issue::feature].

### Documentation issues

Writing good and understandable documentation is a difficult art. Although we always strive for the highest possible
quality, there will always be features not clearly documented or not documented at all.

You are welcome to point out such shortcomings to us. We have prepared
a [documentation request template][issue::documentation] to lower the hurdle as much as possible.

### Technical questions

Even with the best tool, questions arise from time to time. Since we want to make your user experience as smooth as
possible, we are very interested in your questions.

As a communication channel for technical questions, we offer you a [question template][issue::question].

## Submitting a Pull Request

Good pull requests, whether patches, improvements, or new features, are a fantastic help. They should remain focused in
scope and avoid containing unrelated commits.

**Please ask first** before embarking on any significant pull requests
(e.g., implementing features, refactoring code), otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

If you have never created a pull request before, this is your chance 😄.
[Here is a great tutorial][opening-a-pull-request] on how to send one :)

Here is a summary of the steps to follow:

1. [Set up the workspace](#set-up-the-workspace)
2. If you cloned a while ago, get the latest changes from upstream and update dependencies:

```bash
$ git checkout main
$ git pull upstream main
$ yarn run init
```

3. Create a new topic branch (off the main project development branch) to contain your feature, change or fix:

```bash
$ git checkout -b <topic-branch-name>
```

4. Make your code changes, following the [Coding rules](#coding-rules)
5. Push your topic branch up to your fork:

```bash
$ git push origin <topic-branch-name>
```

6. [Open a Pull Request][creating-the-pull-request] with a clear title and description.

**Tips**:

- For ambitious tasks, open a Pull Request as soon as possible with the `[WIP]` prefix in the title, in order to get
  feedback and help from the community.
- [Allow the maintainers to make changes to your Pull Request branch][allow-changes-on-fork]. This way, we can rebase it
  and make some minor changes if necessary. All changes we make will be done in new commits, and we'll ask for your
  approval before merging them.

## Coding rules

### Source code

To ensure consistency and quality throughout the source code, all code modifications must have:

- No [linting](#lint) errors
- A [test](#tests) for every possible case introduced by your code change
- **100%** test coverage
- [Valid commit message(s)](#commit-message-guidelines)
- Documentation for new features
- Updated documentation for modified features

### Documentation

To ensure consistency and quality, all documentation modifications must:

- Refer to brand in [bold][doc-basics-styling]
  with proper capitalization, i.e. **GitHub**, **Angular**, **npm**
- Prefer [tables][doc-basics-tables]
  over [lists][doc-basics-lists]
  when listing key values, i.e. List of options with their description
- Use [links][doc-basics-links]
  when you are referring to:
  - a concept described somewhere else in the documentation, i.e. How to [contribute](CONTRIBUTING.md)
  - a third-party product/brand/service, i.e. [Fetch API]
  - an external concept or feature, i.e. Create a [GitHub release][creating-releases]
- Prefer [Reference-style Links][markdown-reference-style-links] _for external documents_
  to have all external references in a single place
- Use the [single backtick `code` quoting][doc-basics-code] for:
  - commands inside sentences, i.e. the `@rb-mwindh/ngx-theme-manager` command
  - programming language keywords, i.e. `function`, `async`, `String`
  - packages or modules, i.e. The [`@rb-mwindh/ngx-theme-manager`][this-repo] module
- Use the [triple backtick `code` formatting][doc-basics-codeblocks] for:
  - code examples
  - configuration examples
  - sequence of command lines

### Commit message guidelines

#### Atomic commits

If possible, make [atomic commits][atomic_commit], which means:

- a commit should contain exactly one self-contained functional change
- a functional change should be contained in exactly one commit
- a commit should not create an inconsistent state (such as test errors, linting errors, partial fix, feature with
  documentation etc...)

A complex feature can be broken down into multiple commits as long as each one maintains a consistent state and consists
of a self-contained change.

#### Commit message format

To ensure consistency and quality, we're using the [Commitizen CLI] to create commits. The workflow is pretty simple:

1. Make your code changes
2. Stage your code changes

```bash
$ git add .
```

3. Commit your changes using the [Commitizen CLI]

```bash
$ yarn run commit
```

4. Answer all questions

## Working with the code

### Set up the workspace

[Fork][github-fork] the project, [clone][github-clone] your fork, configure the remotes and install the dependencies:

```bash
# Clone your fork of the repo into the current directory
$ git clone https://github.com/<your username>/ngx-theme-manager <repo-name>
# Navigate to the newly cloned directory
$ cd <repo-name>
# Assign the original repo to a remote called "upstream"
$ git remote add upstream https://github.com/rb-mwindh/ngx-theme-manager
# Initialize your workspace (set up commit hooks, etc.)
$ yarn run init
```

### Run the demo app

This workspace provides a demo application to visually test your changes.

You may run this application locally to observe the result of your code changes while developing.

```bash
$ yarn run start
```

### Formatting

This repository uses [Prettier] for formatting. Formatting is executed automatically on commit.

**Please make sure that you've run the `init` script as described [here](#set-up-the-workspace).**

If your IDE provides [Prettier] integration, you might want to activate formatting as **on Save** action.

### Lint

This repository uses [ESLint] for linting. Linting is executed automatically on commit.

**Please make sure that you've run the `init` script as described [here](#set-up-the-workspace).**

### Tests

This repository uses [Jest] for testing.

Before pushing your code changes make sure all **tests pass** and the **coverage is 100%**:

```bash
$ yarn run test
```

### Commits

This repository uses [Commitizen CLI] to help you create
[valid commit messages](#commit-message-guidelines).

After staging your changes with `git add`, run `npm run commit` or use `git-cz` directly to start the interactive commit
message CLI.

---

[this-repo]: https://github.com/rb-mwindh/ngx-theme-manager

[eslint]: https://eslint.org/

[prettier]: https://prettier.io

[lint-staged]: https://www.npmjs.com/package/lint-staged

[fetch api]: https://developer.mozilla.org/de/docs/Web/API/Fetch_API

[commitizen cli]: https://github.com/commitizen/cz-cli

[jest]: https://jestjs.io/

[how-to-contribute]: https://opensource.guide/how-to-contribute

[opening-a-pull-request]: https://opensource.guide/how-to-contribute/#opening-a-pull-request

[creating-the-pull-request]: https://help.github.com/articles/creating-a-pull-request/#creating-the-pull-request

[allow-changes-on-fork]: https://help.github.com/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork

[creating-releases]: https://help.github.com/articles/creating-releases

[doc-basics-styling]: https://help.github.com/articles/basic-writing-and-formatting-syntax/#styling-text

[doc-basics-tables]: https://help.github.com/articles/organizing-information-with-tables

[doc-basics-lists]: https://help.github.com/articles/basic-writing-and-formatting-syntax/#lists

[doc-basics-links]: https://help.github.com/articles/basic-writing-and-formatting-syntax/#links

[doc-basics-code]: https://help.github.com/articles/basic-writing-and-formatting-syntax/#quoting-code

[doc-basics-codeblocks]: https://help.github.com/articles/creating-and-highlighting-code-blocks

[markdown-reference-style-links]: https://www.markdownguide.org/basic-syntax/#reference-style-links

[atomic_commit]: https://en.wikipedia.org/wiki/Atomic_commit

[github-fork]: https://guides.github.com/activities/forking/#fork

[github-clone]: https://guides.github.com/activities/forking/#clone

[issues]: https://github.com/rb-mwindh/ngx-theme-manager/issues

[maintainers]: https://github.com/rb-mwindh/ngx-theme-manager/graphs/contributors

[filter::bad-docs]: https://github.com/rb-mwindh/ngx-theme-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22Type:+Documentation%22

[filter::documentation]: https://github.com/rb-mwindh/ngx-theme-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22Type:+Documentation%22+label%3A%22help+wanted%22

[filter::discussion]: https://github.com/rb-mwindh/ngx-theme-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22Needs:+Discussion%22

[filter::help wanted]: https://github.com/rb-mwindh/ngx-theme-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22

[filter::first]: https://github.com/rb-mwindh/ngx-theme-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22

[issue::bug]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=bug.md&title=🐛%20

[issue::feature]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=feature.md&title=✨%20

[issue::documentation]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=docs.md&title=📝%20

[issue::question]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=question.md&title=❓%20

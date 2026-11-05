# Contributing

## 1. Fork the repository and keep your main branch clean.  

Clone this repository to your own Github using the fork button at the top-right corner of the Github page.
This will create a read-write repository for you.
The main (upstream) repo you clone from is read-only, so your own read-write copy will be your editing stage.
Treat the cloned branches, main and develop, as a mirrors of upstream branchs. Don't develop directly on them.

## 2. Clone your new repo

Clone the repository on your local machine using git commandline or Github for Windows/Mac.
Get the develop branch as well using git checkout -b develop upstream/develop

## 4. Create a new branch based for every logical change.  

Each feature, fix, or improvement should live in its own branch based on your clean main. Small, well-scoped branches make review far easier. e.g. ./develop/myfeature or ./main/myfeature

1. Using the shell, use git checkout -b my-feature
2. Using Github for Mac or Windows, press the new-branch button.

## 5. Document every change when you make commits.

Avoid vague commit messages like "adds feature X" when a dozen files changed. Explain what changed and why. If all changes are trivial, say so explicitly.
Refactoring should only happen after discussing it with upstream.

Use the command-line to commit or use Github for Windows/Mac. Some rules for orderly merges:

1. Bundle changes into logical groups in one commit.
2. Make sure your commits are not too large. Merging your changes is easier if your changesets are small.
3. Bundle multiple commits into one Pull Request.

For example when adding a feature:

1. Each task that implements a basic feature or improves that feature could each be one commit.
2. Fixing mistakes could be another commit.
3. Renaming of the new files in your new feature should also be one commit.
4. These commits will together form a nice Pull Request.

Periodically save your work by pushing them to your github repository.

## 6. When a branch is complete and builds/runs, open a PR.  

Describe the problem it solves or the feature it implements, and summarize the testing you've done. This helps maintainers evaluate impact quickly.

Go to your own Github page for your own KE repository. You'll see that you've recently pushed branches. Press the big green button and write a description for your changes.
Please be verbose. It helps to review your changes. When you are done describing your changes, press "Create pull request".

## 7. Keep unrelated work separated from the main and develop branches.

If you've already made everything on your main or develop, you can still recover by creating a new branch and using Git to move the your feature specific changes off into their own branch (e.g., via git restore -p, git stash -p, or cherry-picking).

## 8. For improvements that benefit KE itself, branch from your clean main or develop branch, not from your feature branch as this will complicate the eventual PR unless you merge those changed into your feature branch first.

# Adding more stuff to your feature branch

After you've created a Pull Request, you will probably receive feedback from fellow developers. They might ask for fixes. Please fix these in the feature branch you created the PR from and add more commits. Just push to your repository to update the PR automatically.

## 9. Update your main and develop branches when new features are added.

When KE accepts improvements from any developer, you will want to pull the upstream main and develop branches into your local branches. This keeps your feature work layered cleanly on top of upstream KE rather than tangled with it.
Note that it's possible that some other change that was made part of the upstream branches breaks some pending PR or feature braches you are working on.
If that happens, you will have to revise your PR (and not revert those changes) before your feature PR can be accepted.


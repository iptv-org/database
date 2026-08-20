# Scripts

The repository contains a few scripts created to automate routine processes and make it a bit easier to maintain.

For the scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

- [act:check](#actcheck)
- [act:deploy](#actdeploy)
- [act:update](#actupdate)
- [act:validate_issue](#actvalidate_issue)
- [act:validate_label](#actvalidate_label)
- [db:validate](#dbvalidate)
- [db:export](#dbexport)
- [db:update](#dbupdate)
- [issue:validate](#issuevalidate)
- [lint](#lint)
- [test](#test)

## act:check

Runs the [check](./workflows.md#check) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:check
```

## act:deploy

Runs the [deploy](./workflows.md#deploy) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:deploy
```

## act:update

Runs the [update](./workflows.md#update) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:update
```

## act:validate_issue

Runs the [validate_issue](./workflows.md#validate_issue) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:validate_issue -- -e .github/mocks/events/issue_opened.json
```

## act:validate_label

Runs the [validate_label](./workflows.md#validate_label) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:validate_label -- -e .github/mocks/events/issue_approved.json --actor Bob
```

## db:validate

Checks all the data in the database for errors.

```sh
npm run db:validate
```

## db:export

Creates JSON files with all the data for the [iptv-org/api](https://github.com/iptv-org/api) repository.

```sh
npm run db:export
```

## db:update

Triggers an update of the database. The process involves processing approved requests from issues.

```sh
npm run db:update
```

## issue:validate

Checks the request from the issue for errors and, if any are found, saves them to the file `temp/logs/errors.txt`.

```sh
npm run issue:validate --body "Issue Body" --labels "label1,label2"
```

## lint

Checks the scripts for syntax errors.

```sh
npm run lint
```

## test

Runs a test of all the scripts described above.

```sh
npm test
```

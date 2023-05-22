# Go Covdata action

A fork of 5monkeys/cobertura-action that just parses the raw output of Go's built-in coverage tool. Since this tool does not output line or branch statistics, converting it to XML and running it through Cobertura doesn't provide much extra info. The end result is almost identical to the text output of `go test -cover`.

This action requires a project running Go 1.20 or later, as this is when the `covdata` tool was introduced. To create the raw output in the right format, run your tests with the following commands:

`$ go test ./... -v -cover -test.gocoverdir="$PWD/coverage" -coverpkg=./...`

| Argument         | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| -v               | verbose (nice for CI)                                         |
| -cover           | generate coverage                                             |
| -test.gocoverdir | save coverage profiles to this directory                      |
| -coverpkg        | `./...`: consider all packages, even those without test files |

`$ go tool covdata percent -i coverage > coverage/percent`

| Argument | Meaning                                      |
| -------- | -------------------------------------------- |
| covdata  | parse previously generated coverage profiles |
| percent  | report coverage percentage by package        |
| -i       | input directory where profiles are located   |

The directory where you place you coverage profile and filename of the ultimate report are up to you; just be sure to pass it as the action's `path` input.

## What it looks like

A comment is added to the pull request with the coverage report.

![alt text](img/comment.png "Pull request comment with metrics")

A check is added to the workflow run.

![alt text](img/check.png "Check with metrics")

The check will succeed or fail based on your threshold when `fail_below_threshold` is set to `true`, this allows you to mandate coverage checks pass on your [protected branches](https://docs.github.com/en/github/administering-a-repository/defining-the-mergeability-of-pull-requests/about-protected-branches).

## Inputs

### `repo_token`

The GITHUB_TOKEN. Defaults to `${{github.token}}`

### `path`

The path to the percentage report. Defaults to `coverage/percent`. Glob pattern is supported, for example `coverage/*.txt`.

### `skip_covered`

If files with 100% coverage should be ignored. Defaults to `true`.

### `minimum_coverage`

The minimum allowed coverage percentage as an integer.

### `fail_below_threshold`

Fail the action when the minimum coverage was not met.

### `only_changed_files`

Only show coverage for changed files.

### `report_name`

Use a unique name for the report and comment.

### `pull_request_number` **Optional**

Pull request number associated with the report. This property should be used when workflow trigger is different than `pull_request`.

If no pull request can determine the action will skip adding the comment.

## Example usage

```yaml
on:
  pull_request:
    types: [opened]
    branches:
      - master
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: joshfrench/covdata-percent@master
        with:
          path: coverage/percent
          minimum_coverage: 75
```

## Development

- Install deps: `npm ci`
- Run tests: `npm run test`
- Run lint: `npm run lint`
- Package application `npm run package`. Remember to run this before committing anything.

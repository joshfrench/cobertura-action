const nock = require("nock");

const owner = "someowner";
const repo = "somerepo";
const dummyReport = {
  total: 72.7,
  files: [
    {
      filename: "bar.go",
      total: 67,
    },
    {
      filename: "baz.go",
      total: 0,
    },
    {
      filename: "qux.go",
      total: 78,
    },
  ],
};

beforeEach(() => {
  process.env["INPUT_REPO_TOKEN"] = "hunter2";
  process.env["GITHUB_REPOSITORY"] = `${owner}/${repo}`;
  process.exitCode = 0;
  process.stdout.write = jest.fn();
});

test("action", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    pull_request: { number: prNumber, head: { sha: "decafbad" } },
  });
  await action();
});

test("action triggered by workflow event", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls?state=open`)
    .reply(200, [
      {
        number: 1,
        head: {
          sha: "decafbad",
        },
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    workflow_run: { head_commit: { id: "decafbad" } },
  });
});

test("action triggered by push", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";

  const body = {
    name: "coverage",
    head_sha: "decafbad",
    status: "completed",
    conclusion: "failure",
    output: {
      title: "coverage",
      summary:
        '<strong></strong>\n\n| File | Coverage |   |\n| - | :-: | :-: |\n| **All files** | `36%` | :x: |\n| foo.go | `0%` | :x: |\n| bar.go | `67%` | :x: |\n| baz.go | `0%` | :x: |\n| qux.go | `78%` | :x: |\n\n_Minimum allowed coverage is `100%`_\n\n<p align="right">Generated with go test -cover against decafbad </p>',
    },
  };
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/check-runs`, body)
    .reply(200);
  await action({
    after: "decafbad",
  });
});

test("action passing pull request number directly", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "decafbad",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    push: { ref: "master" },
  });
});

test("action only changes", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "true";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    pull_request: { number: prNumber, head: { sha: "decafbad" } },
  });
  await action();
});

test("action with report name", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "true";
  process.env["INPUT_REPORT_NAME"] = "Test Report";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    pull_request: { number: prNumber, head: { sha: "decafbad" } },
  });
  await action();
});

test("action with crop missing lines", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "true";
  process.env["INPUT_SHOW_MISSING_MAX_LENGTH"] = "10";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    pull_request: { number: prNumber, head: { sha: "decafbad" } },
  });
  await action();
});

test("action failing on coverage below threshold", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "decafbad",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    push: { ref: "master" },
  });
  expect(process.exitCode).toBe(1);
  expect(process.stdout.write).toHaveBeenCalledTimes(1);
  expect(process.stdout.write).toHaveBeenCalledWith(
    "::error::Minimum coverage requirement was not satisfied\n"
  );
});

test("action not failing on coverage above threshold", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/*";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "30";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "decafbad",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    push: { ref: "master" },
  });
  expect(process.exitCode).toBe(0);
  expect(process.stdout.write).toHaveBeenCalledTimes(0);
});

test("markdownReport", () => {
  const { markdownReport } = require("./action");
  const commit = "decafbad";
  const reportName = "TestReport";
  const defaultReportName = "Coverage Report";
  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      reportName: reportName,
    })
  ).toBe(`<strong>${reportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :white_check_mark: |
| bar.go | \`67%\` | :x: |
| baz.go | \`0%\` | :x: |
| qux.go | \`78%\` | :white_check_mark: |

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);

  expect(markdownReport([dummyReport], commit))
    .toBe(`<strong>${defaultReportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :x: |
| bar.go | \`67%\` | :x: |
| baz.go | \`0%\` | :x: |
| qux.go | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);

  expect(markdownReport([dummyReport], commit, { minimumCoverage: 70 }))
    .toBe(`<strong>${defaultReportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :white_check_mark: |
| bar.go | \`67%\` | :x: |
| baz.go | \`0%\` | :x: |
| qux.go | \`78%\` | :white_check_mark: |

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);

  expect(markdownReport([dummyReport], commit, { filteredFiles: ["bar.go"] }))
    .toBe(`<strong>${defaultReportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :x: |
| bar.go | \`67%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);

  expect(
    markdownReport([dummyReport], commit, { filteredFiles: ["README.md"] })
  ).toBe(`<strong>${defaultReportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);

  expect(markdownReport([dummyReport], commit, { filteredFiles: [] }))
    .toBe(`<strong>${defaultReportName}</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`72%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated with go test -cover against decafbad </p>`);
});

test("addComment", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }]);
  await addComment(prNumber, "foo", "bar");
});

test("addComment with update", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const commentId = 123;
  const oldComment = `<strong>bar</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :monkey: cobertura-action against decafbad </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: oldComment, id: commentId }])
    .patch(`/repos/${owner}/${repo}/issues/comments/${commentId}`)
    .reply(200, [{ body: oldComment, id: commentId }]);
  await addComment(prNumber, "foo", "bar");
});

test("addComment for specific report", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const commentId = 123;
  const report1Comment = `Report1
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :monkey: cobertura-action against decafbad </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: report1Comment, id: commentId }]);
  await addComment(prNumber, "foo", "Report2");
});

test("addComment with update for specific report", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const comment1Id = 123;
  const comment2Id = 456;
  const report1Comment = `Report1
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :monkey: cobertura-action against decafbad </p>`;
  const report2Comment = `Report2
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`82%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :monkey: cobertura-action against decafbad </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [
      { body: report1Comment, id: comment1Id },
      { body: report2Comment, id: comment2Id },
    ])
    .patch(`/repos/${owner}/${repo}/issues/comments/${comment2Id}`)
    .reply(200, [{ body: report2Comment, id: comment2Id }]);
  await addComment(prNumber, "foo", "Report2");
});

test("listChangedFiles", async () => {
  const { listChangedFiles } = require("./action");
  const prNumber = "5";
  nock("https://api.github.com")
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ]);
  await listChangedFiles(prNumber);
});

test("addCheck", async () => {
  const { addCheck } = require("./action");
  const checkRunMock = nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await addCheck("foo", "bar", "fake_sha", "success");

  expect(checkRunMock.pendingMocks().length).toBe(0);
});

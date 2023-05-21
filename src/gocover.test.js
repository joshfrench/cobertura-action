const { processCoverage } = require("./gocover");

test("coverage", async () => {
  const reports = await processCoverage("./src/fixtures/cover");
  expect(reports.length).toBe(1);
  expect(reports[0].folder).toBe("cover");
  expect(reports[0].total).toBe(36.35);

  const files = reports[0].files;
  expect(files[0].total).toBe(0);
  expect(files[0].filename).toBe("foo.go");

  expect(files[1].total).toBe(67);
  expect(files[1].filename).toBe("bar.go");

  expect(files[2].total).toBe(0);
  expect(files[2].filename).toBe("baz.go");

  expect(files[3].total).toBe(78.4);
  expect(files[3].filename).toBe("qux.go");
});

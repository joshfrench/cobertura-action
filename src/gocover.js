const fs = require("fs");
const glob = require("glob-promise");
const readline = require("readline");

const filename = str => str.match(/\S+/) && RegExp.lastMatch
const percent = str => str.match(/([0-9]+.[0-9]+)%/) && parseFloat(RegExp.lastMatch, 10) || 0

/**
 * generate the report for the given file
 *
 * @param path: string
 * @param options: object
 * @return {Promise<{total: number, files: T[]}>}
 */
async function readCoverageFromFile(path, options) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const files = [];

  for await (const line of rl) {
    files.push({
      filename: filename(line),
      total: percent(line)
    })
  }
  const total = files.reduce((acc, curr) => acc + curr.total, 0) / files.length;
  // TODO: filter files
  return { total, files };
}

/**
 *
 * @param path: string
 * @param options: {}
 * @returns {Promise<{total: number, folder: string, files: T[]}[]>}
 */
async function processCoverage(path, options) {
  options = options || { skipCovered: false };

  const paths = glob.hasMagic(path) ? await glob(path) : [path];
  const positionOfFirstDiff = longestCommonPrefix(paths);
  return await Promise.all(
    paths.map(async (path) => {
      const report = await readCoverageFromFile(path, options);
      const folder = trimFolder(path, positionOfFirstDiff);
      return {
        ...report,
        folder,
      };
    })
  );
}

function trimFolder(path, positionOfFirstDiff) {
  const lastFolder = path.lastIndexOf("/") + 1;
  if (positionOfFirstDiff >= lastFolder) {
    return path.substr(lastFolder);
  } else {
    const startOffset = Math.min(positionOfFirstDiff - 1, lastFolder);
    const length = path.length - startOffset - lastFolder - 2; // remove filename
    return path.substr(startOffset, length);
  }
}

/**
 *
 * @param paths: [string]
 * @returns number
 */
function longestCommonPrefix(paths) {
  let prefix = "";
  if (paths === null || paths.length === 0) return 0;

  for (let i = 0; i < paths[0].length; i++) {
    const char = paths[0][i]; // loop through all characters of the very first string.

    for (let j = 1; j < paths.length; j++) {
      // loop through all other strings in the array
      if (paths[j][i] !== char) return prefix.length;
    }
    prefix = prefix + char;
  }

  return prefix.length;
}

module.exports = {
  processCoverage,
  longestCommonPrefix,
  trimFolder,
};

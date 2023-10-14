import { $, glob, fs } from "zx";

$.verbose = false;

const target = process.argv
  .slice(process.argv.findIndex((it) => it === "--") + 1)
  .pop();

let allFiles = await glob([`${target}/src/**/*`]);
let files = allFiles.filter(
  (it) =>
    !it.includes("__tests__") &&
    !it.includes("__mocked__") &&
    !it.includes("__stories__")
);
let testFiles = (await glob([`${target}/src/**/*`])).filter(
  (it) =>
    it.includes("__tests__") ||
    it.includes("__mocked__") ||
    it.includes("__stories__")
);

const fileContent = files.length > 0 ? await $`cat ${files}` : { stdout: "" };

const imports = [];

for (const entry of fileContent.stdout.matchAll(
  /(import [\s\S]*? from ".*?)";/gm
)) {
  imports.push(entry[0]);
}

const uniqueDeps = new Set();
const uniqueDevDeps = new Set();

for (const importee of imports) {
  const isDevDep = /import type/.test(importee);
  const [, pkg] = importee.match(/from "(.*?)"/);

  // Discard interal/relative packages
  if (pkg.startsWith(".")) {
    continue;
  }

  if (isDevDep) {
    uniqueDevDeps.add(pkg);
  } else {
    uniqueDeps.add(pkg);
  }
}

const testFileContent =
  testFiles.length > 0 ? await $`cat ${testFiles}` : { stdout: "" };

const testImports = [];

for (const entry of testFileContent.stdout.matchAll(
  /(import [\s\S]*? from ".*?)";/gm
)) {
  testImports.push(entry[0]);
}

for (const importee of testImports) {
  const [, pkg] = importee.match(/from "(.*?)"/);

  // Discard interal/relative packages
  if (pkg.startsWith(".")) {
    continue;
  }

  uniqueDevDeps.add(pkg);
}

const packagejson = await fs.readJson(`${target}/package.json`);

const missingDeps = Array.from(uniqueDeps).filter(
  (it) => !Object.keys(packagejson.dependencies).includes(it)
);
const missingDevDeps = Array.from(uniqueDevDeps).filter(
  (it) =>
    !Object.keys(packagejson.devDependencies).includes(it) &&
    !Object.keys(packagejson.dependencies).includes(it)
);

const unnecessaryDevDeps = Object.keys(
  packagejson.devDependencies ?? {}
).filter(
  (it) =>
    !it.startsWith("@tooling/") &&
    !uniqueDeps.has(it) &&
    // if it's an @types/*, then check if we're explicitly using * as a dep
    !(it.startsWith("@types/") && uniqueDeps.has(it.substring(7))) &&
    // @types/gyldendal-* installs global definitions
    !it.startsWith("@types/gyldendal-") &&
    !uniqueDevDeps.has(it)
);

const unnecessaryDeps = Object.keys(packagejson.dependencies ?? {}).filter(
  (it) => !uniqueDeps.has(it)
);

console.log("DevDeps:\n");
console.log(Array.from(uniqueDevDeps).join("\n"));

console.log("\n\nDeps:\n");
console.log(Array.from(uniqueDeps).join("\n"));

if (unnecessaryDevDeps.length > 0) {
  console.log("\n\n\nUnnecessary devDeps:\n");
  console.log(unnecessaryDevDeps.join("\n"));
}

if (unnecessaryDeps.length > 0) {
  console.log("\n\n\nUnnecessary deps:\n");
  console.log(unnecessaryDeps.join("\n"));
}

if (missingDevDeps.length > 0) {
  console.log("\n\n\nMissing devDeps in package.json:\n");
  console.log(missingDevDeps.join("\n"));
}

if (missingDeps.length > 0) {
  console.log("\n\nMissing deps in package.json:\n");
  console.log(missingDeps.join("\n"));
}

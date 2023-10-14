#!/usr/bin/env node

/**
 * custom script that'll run TypeScript checking against the current workspace
 * only to optimize performance of the type-check command within the monorepo
 *
 * because we reference the source files directly as types inside package.json
 * by convention (for a much more performant IDE DX), it has the side effect of
 * forcing TypeScript to validate types for a file every time it's referenced
 * inside another workspace
 *
 * in our rather large codebase, this causes an unnecessaryly large overhead
 */

const path = require("path");
const ts = require("typescript");

//
// parse tsconfig.json
//

const configFilePath = ts.findConfigFile(
  "./",
  ts.sys.fileExists,
  "tsconfig.json"
);

const projectPath = path.resolve(path.dirname(configFilePath));
const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);

if (configFile.config.extends) {
  if (Array.isArray(configFile.config.extends)) {
    throw new Error(
      "type-check: currently using array syntax for extends isn't supported, please provide a singular string value only"
    );
  }
  try {
    configFile.config.extends = require.resolve(configFile.config.extends);
  } catch (err) {
    return filePath;
  }
}

const compilerOptions = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  "./",
  {
    incremental: true,
    tsBuildInfoFile: path.join(projectPath, "tsconfig.tsbuildinfo"),

    // required to force emission of tsbuildinfo file(?)
    outDir: "tmp",
    noEmit: true,
  }
);

//
// setup program
//

const program = ts.createIncrementalProgram({
  rootNames: compilerOptions.fileNames,
  options: compilerOptions.options,
});

//
// run diagnostics and emit a tsbuildinfo for incremental type-checks
//

console.log(program);
process.exit(0);

const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
const emitResult = program.emit();
const buildInfoEmitResult = program.emitBuildInfo();

const diagnostics = [
  ...preEmitDiagnostics,
  ...emitResult.diagnostics,
  ...buildInfoEmitResult.diagnostics,
].filter(
  (it) =>
    path.resolve(it.file.fileName).startsWith(projectPath + path.sep) &&
    !it.file.fileName.includes("node_modules")
);

//
// setup reporter utilities
//

const errorCount = ts.getErrorCountForSummary(diagnostics);
const filesInError = ts.getFilesInErrorForSummary(diagnostics);
const diagnosticsReporter = ts.createDiagnosticReporter(ts.sys, true);

const reportDiagnostics = (diagnostics) => {
  for (const diagnostic of diagnostics) {
    diagnosticsReporter(diagnostic);
  }
};

const reportSummary = (errorCount, filesInError) => {
  console.log(
    ts.getErrorSummaryText(errorCount, filesInError, ts.sys.newLine, ts.sys)
  );
};

//
// flush output to console
//

reportDiagnostics(diagnostics);
reportSummary(errorCount, filesInError);

process.exit(errorCount === 0 ? 0 : 1);

const fs = require("fs");
const path = require("path");

/**
 * @param {string} projectRoot
 * @param {Partial<import('rollup').RollupOptions>} rollupConfig
 * @returns {import('rollup').RollupOptions}
 */
function withCommonConfig(projectRoot, rollupConfig = {}) {
  const srcFolder = path.resolve(projectRoot, "src");
  const libFolder = path.resolve(
    projectRoot,
    rollupConfig.output?.dir ?? "lib"
  );

  return {
    input: fs.existsSync(path.resolve(srcFolder, "index.tsx"))
      ? path.resolve(srcFolder, "index.tsx")
      : path.resolve(srcFolder, "index.ts"),

    external: (moduleId, importedFrom) => {
      if (moduleId.startsWith(srcFolder)) {
        // any modules imported through an absolute path within the src folder
        // are inherently internal to the application
        return false;
      }

      if (importedFrom.startsWith(srcFolder) && moduleId.startsWith(".")) {
        // all relative paths imported from files located within the src folder
        // are also inherently internal to the applcation
        return false;
      }

      return true;
    },

    ...rollupConfig,

    output: {
      dir: "lib",
      format: "esm",
      entryFileNames: "[name].mjs",

      ...rollupConfig.output,

      assetFileNames: "[name][extname]",
      preserveModules: true,
      sourcemap: "inline",
      interop: "auto",
    },

    plugins: [
      ...(rollupConfig.plugins ?? []),
      writeChangedFilesOnly(libFolder),
    ],
  };
}

module.exports = withCommonConfig;

/**
 * custom plugin that ensures that only files that have been actually changed
 * since the last generation actually are written to disk.
 * By doing so we greatly improve performance when watching files through e.g.
 * NextJS and Storybook
 */
function writeChangedFilesOnly(libFolder) {
  return {
    name: "write-changed-files-only",
    generateBundle: (options, bundle) => {
      for (const [key, entry] of Object.entries(bundle)) {
        // To prevserve performance we skip checking sourcemaps as we know that
        // they will only have been changed if their source has been changed.
        if (key.endsWith(".map")) {
          continue;
        }

        const outputPath = path.join(libFolder, key);
        let previousContent = safeReadFile(outputPath);

        // In case the content from the previous build isn't available, then we
        // must assume that content should be emitted
        if (!previousContent) {
          continue;
        }

        let currentContent;

        if (entry.type === "asset") {
          currentContent = entry.source;
        }

        if (entry.type === "chunk") {
          currentContent = entry.code;
        }

        // In case we cannot extract the current content of the entry, then we
        // cannot perform any checks and as such we just emit it to be safe.
        if (!currentContent) {
          continue;
        }

        const didChange = previousContent !== currentContent;

        // ... finally, in case content did not change since the previous
        // emission, then there is not point in emitting the file to the
        // file system.
        if (!didChange) {
          delete bundle[key];
          delete bundle[`${key}.map`];
        }
      }
    },
  };
}

function safeReadFile(path) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (err) {
    return undefined;
  }
}

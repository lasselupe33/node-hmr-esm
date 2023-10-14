const esbuild = require("rollup-plugin-esbuild").default;

const withCommonConfig = require("./config.common");

/**
 * @param {string} projectRoot
 * @param {Partial<import('rollup').RollupOptions>} rollupConfig
 * @returns {import('rollup').RollupOptions}
 */
function withEsbuildConfig(projectRoot, rollupConfig = {}) {
  return withCommonConfig(projectRoot, {
    ...rollupConfig,

    plugins: [
      esbuild({
        sourceMap: true,
        jsx: "automatic",
        target: "node20",
      }),
      ...(rollupConfig.plugins ?? []),
    ],
  });
}

module.exports = withEsbuildConfig;

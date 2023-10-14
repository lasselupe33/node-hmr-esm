const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig({
  input: {
    empty: "./src/index.empty.ts",
    "loader.hmr": "./src/loader.hmr.ts",
    "loader.esbuild": "./src/loader.esbuild.ts",
  },
});

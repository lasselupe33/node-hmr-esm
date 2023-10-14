const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig();

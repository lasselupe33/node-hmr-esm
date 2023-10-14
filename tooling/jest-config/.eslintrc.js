require("@tooling/eslint-config/patch");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = {
  extends: [require.resolve("@tooling/eslint-config/recommended")],
  env: {
    "jest/globals": true,
  },
};

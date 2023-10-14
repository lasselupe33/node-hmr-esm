require("@tooling/eslint-config/patch");

process.env.GYL__WORKSPACE_ROOT = __dirname;

module.exports = {
  extends: [require.resolve("@tooling/eslint-config/recommended")],
};

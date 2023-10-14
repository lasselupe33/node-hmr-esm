/**
 * @param {Partial<import('jest').Config>} jestConfig
 * @returns {import('jest').Config}
 */
function withRecommendedConfig(jestConfig) {
  return require("./config.base")({
    ...jestConfig,

    testMatch: ["**/src/**/__tests__/**/*.unit.{js,jsx,ts,tsx}"],
  });
}

module.exports = withRecommendedConfig;

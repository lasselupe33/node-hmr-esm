const path = require("path");

/**
 * @param additionalConfig {import('jest').Config}
 * @returns {import('jest').Config}
 */
module.exports = (additionalConfig) => ({
  roots: ["<rootDir>"],
  modulePathIgnorePatterns: ["/lib/"],
  coverageDirectory: "<rootDir>/.coverage",

  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    /**
     * the following configuration fixes issues with packages that assume ESM
     * support in browser-based environments (which still isn't the case for
     * jest, but jest-environment-jsdom auto-configures custom export options
     * to use browser versions)
     *
     * at the time of writing (February 9th 2023) this caused a runtime
     * exception to be thrown while running jest, if any packages depended on
     * node_modules/uuid - even transiently
     */
    customExportConditions: ["node", "node-addons"],
  },

  ...additionalConfig,

  setupFiles: [
    path.join(__dirname, "mock.global.js"),

    ...(additionalConfig.setupFiles ?? []),
  ],
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],

  transform: {
    "\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],

    ...(additionalConfig.transform ?? []),
  },
  transformIgnorePatterns: [
    // configure jest to allow transformation of internal packages, as we need
    // to transform ESM syntax exports to CommonJS in order to support the Jest
    // runtime
    "node_modules/(?!@app|@pm2|@provider|@ui|@utils|@popperjs)",

    ...(additionalConfig.transformIgnorePatterns ?? []),
  ],

  moduleNameMapper: {
    "\\.css": "identity-obj-proxy",
    "@linaria/core": path.join(__dirname, "mock.linaria.js"),
    "^lodash-es$": "lodash",

    ...additionalConfig.moduleNameMapper,
  },
});

const path = require("path");

// determine if we're trying to compile files from within Danger JS - in that
// case we need to make certain adjustments to the config, to make sure that the
// transpilation works flawlessly
const isRunningFromDangerJs = process.argv[1]?.includes(
  `${path.sep}node_modules${path.sep}danger${path.sep}`
);

/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: false,
        bugfixes: true,

        // by default we assume that a build tool or a bundler will be used to
        // handle import statements - therefore we leave them untouched, so
        // that we can get the most of built-in tree shaking in external build
        // tools
        //
        // however, specifically in test scenarios, we will need to transpile
        // it down into a format that's compatible with our test runner
        modules:
          process.env["BABEL_CONFIG__PRESET_ENV__MODULES"] ??
          (process.env["NODE_ENV"] !== "test" ? false : "commonjs"),
      },
    ],

    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],

    ["@babel/preset-typescript"],

    // auto-include support for linaria, if it's been installed within the
    // repository
    isNodeModuleInstalled("@linaria/babel-preset") && !isRunningFromDangerJs
      ? [
          "@linaria/babel-preset",
          {
            babelOptions: {
              configFile: __filename,
            },
          },
        ]
      : null,
  ].filter((it) => it !== null),

  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties"],
    ["@babel/plugin-proposal-numeric-separator"],
    [
      "@babel/plugin-transform-runtime",
      {
        corejs: 3,
      },
    ],
  ],
};

/**
 * simple utility to safely determine if a node_module has been installed in
 * the current project, by trying to resolve it and checking if that causes
 * issues with the node.js resolver
 */
function isNodeModuleInstalled(moduleId) {
  try {
    require.resolve(moduleId);
    return true;
  } catch (err) {
    return false;
  }
}

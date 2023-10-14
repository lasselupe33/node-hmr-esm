const path = require("path");

const workspaceRoot = (() => {
  if (process.env.WORKSPACE_ROOT) {
    return process.env.WORKSPACE_ROOT;
  }

  // eslint-disable-next-line no-console
  console.warn(
    "@tooling/eslint-config: WORKSPACE_ROOT not defined, falling back to process.cwd()!"
  );
  return process.cwd();
})();

/**
 * @returns {import("eslint").Linter.Config}
 */
module.exports = {
  root: true,

  env: {
    node: true,
    es6: true,
  },

  parserOptions: {
    ecmaVersion: "latest",
    es6: true,
  },

  settings: {
    react: {
      version: "detect",
    },
  },

  ignorePatterns: ["**/lib/**/*", "**/node_modules/**/*", "**/*.json"],

  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:import/react",
    "plugin:comment-length/recommended",
    "plugin:grouped-css-declarations/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],

  rules: {
    "comment-length/limit-tagged-template-literal-comments": [
      "warn",
      { tags: ["css"] },
    ],

    //
    // add useIsomorphicLayoutEffect to exhaustive deps check
    //

    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useIsomorphicLayoutEffect)",
      },
    ],

    //
    // stricter import checks
    //

    "import/no-relative-packages": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/src/**/__tests__/**/*",
          "**/src/**/*.story.*",
          "**/.*rc.*",
          "**/cypress.config.ts",
          "**/next.config.js",
          "**/rollup.config.js",
          "**/webpack.config.js",
          "**/dangerfile.js",
          "**/esbuild.js",
          "cypress.config.ts",
          "next.config.js",
          "rollup.config.js",
          "dangerfile.js",
          "webpack.config.js",
          "esbuild.js",
        ],
        optionalDependencies: false,
        peerDependencies: false,
        bundledDependencies: false,
      },
    ],
    "import/order": [
      "error",
      {
        alphabetize: {
          order: "asc",
        },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        pathGroups: [
          {
            pattern: "@pm2/**",
            group: "internal",
          },
          {
            pattern: "@provider/**",
            group: "internal",
          },
          {
            pattern: "@ui/**",
            group: "internal",
          },
          {
            pattern: "@utils/**",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
      },
    ],

    //
    // disable unwanted rules from recommended configurations
    //

    "no-constant-condition": "off",

    //
    // disable irrelevant rules to improve performance of eslint
    //

    "react/no-direct-mutation-state": "off", // we use functional components

    //
    // disable/alter rules that wrongly report errors
    //

    "jsx-a11y/no-autofocus": [
      "error",
      {
        ignoreNonDOM: true,
      },
    ],
  },

  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: ["plugin:@typescript-eslint/recommended"],
      parserOptions: {
        project: path.resolve(workspaceRoot, "tsconfig.json"),
      },

      rules: {
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            prefer: "type-imports",
            fixStyle: "separate-type-imports",
          },
        ],

        //
        // disable legacy React plugin rules (irrelevant as we're using
        // TypeScript with latest version of JSX runtime)
        //

        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",

        //
        // disable irrelevant rules to improve performance of eslint
        //

        "import/no-unresolved": "off", // caught by TypeScript
        "import/namespace": "off", // caught by TypeScript
      },
    },

    // Ensure that the jest plugin is only applied to unit test files
    {
      files: ["**/__tests__/**/*.unit.ts", "**/__tests__/**/*.integration.ts"],
      extends: ["plugin:jest/recommended"],
      env: {
        "jest/globals": true,
      },
    },

    // Ensure that the cypress plugin is only applied to cypress related files
    {
      files: ["**/cypress/**/*.ts", "cypress.config.ts"],
      extends: ["plugin:cypress/recommended"],
      env: {
        "cypress/globals": true,
      },
      parserOptions: {
        project: path.resolve(workspaceRoot, "cypress", "tsconfig.json"),
      },
    },
  ],
};

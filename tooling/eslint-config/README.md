# ESLint

Standard tooling to add [ESLint] to a project, with our pre-defined custom configuration.

## Table of Contents

- [ESLint](#eslint)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)

## Purpose of this tooling

ESLint is implemented to help improve code quality by performing static code analysis and reporting potential issues to developers early on directly in their IDE as well as scanning for issues prior to deploying code in CI environments.

## Setting up a new project

To set up ESLint within a new project, there is a few steps to take. Start by installing this package:

```bash
> npm install --save-dev @tooling/eslint-config
```

And then add an `eslint` script to your `package.json` as such:

```jsonc
{
  "name": "@gyldendal/my-package",
  // ...
  "scripts": {
    "eslint": "eslint --cache --no-error-on-unmatched-pattern --max-warnings 20 'src/**/*.{js,jsx,ts,tsx,mjs}'"
  }
}
```

Finally you'll need to extend the shared configuration, which is done by pasting the following snippet into `.eslintrc.js` in the root of your package:

```js
require("@tooling/eslint-config/patch");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = {
  extends: [
    require.resolve("@tooling/eslint-config/recommended"),
    require.resolve("@tooling/eslint-config/next"), // optionally add next config, if you're working within a next.js app
  ],
};
```

That's it! 💫 If you've configured ESLint within your IDE, you should now begin seeing squiggly lines in case of errors and warnings, and analysis of the package should be automatically tie in with the rest of your tooling.

[ESLint]: https://eslint.org/

# Jest

Standard tooling to add [Jest] to a project, with our pre-defined custom configuration.

## Table of Contents

- [Jest](#jest)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)

## Purpose of this tooling

Jest is used as our primary test runner for unit and integration tests.

## Setting up a new project

To set up Jest within a new project, there is a few steps to take. Start by installing this configuration:

```bash
> npm install --save-dev @tooling/jest-config
```

Then you'll need to extend the shared configuration, which is done by pasting the following snippet into `.jestrc.js` in the root of your project:

```js
const withRecommendedConfig = require("@tooling/jest-config/recommended");

module.exports = withRecommendedConfig({
  roots: ["<rootDir>"] // Remember to add all relevant roots of your project, in case the current repo is a monorepository
});
```

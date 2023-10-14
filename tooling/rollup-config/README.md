# Rollup for packages

Standard configuration of [Rollup] to transpile and bundle packages before publishing.

## Table of Contents

- [Rollup for packages](#rollup-for-packages)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)
    - [Within frontend-arch-clientside-monorepo](#within-frontend-arch-clientside-monorepo)

## Purpose of this tooling

Rollup is used to perform transpilation and bundling of packages before they are published, so that they are easily digestible by third-party applications. This step means that developers can install published packages, without having to worry about configuring build pipelines to meet all requirements set by these packages.

Additionally it enables us to extract CSS-in-JS to static `.css` files, which can then be automatically imported when using React components in third-party applications - which additionally reduces mental overhead of installing and using packages, as styles and components are strongly tied to each other.

## Setting up a new project

To set up Rollup within a new project, there is a few steps to take. Start by installing this configuration:

```bash
> npm install --save-dev @tooling/rollup-config rimraf
```

And then add a few additional configurations to your `package.json` as such:

```jsonc
{
  "name": "@gyldendal/my-package",
  // ...
  "main": "lib/index.js",
  "types": "src/index.ts",
  "files": ["lib/**/*", "src/**/*"],
  // ...
  "scripts": {
    "dev": "npx rollup -c rollup.config.js --watch",
    "build": "npx rollup -c rollup.config.js",
    "prepublishOnly": "npm run build"
  }
}
```

Finally you'll need to extend the shared configuration, which is done by pasting the following snippet into `rollup.config.js` in the root of your package:

```js
const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig({});
```

That's it! 💫 Rollup should now tie in with the rest of your tooling automatically.

### Within frontend-arch-clientside-monorepo

If you're creating a new package within the clientside-monorepo, you'll need adjust `prepublishOnly` to run through a custom script, which uses the turbo task runner to ensure that all dependencies are also built correctly.

```jsonc
{
  "name": "@gyldendal/my-package",
  // ...
  "scripts": {
    "prepublishOnly": "npx zx ../../.scripts/prepublish.mjs"
  }
}
```

[Rollup]: https://rollupjs.org/guide/en/

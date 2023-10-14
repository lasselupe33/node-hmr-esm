# Babel for packages

Standard configuration of [babel] tailored to create optimized output for published packages by using @babel/runtime to perform scoped polyfilling.

## Table of Contents

- [Babel for packages](#babel-for-packages)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)

## Purpose of this tooling

Babel will enable using modern ECMAScript features with automatic transpiling down to a format, which is compatible with all supported browsers. Additionally it provides an extensible interface, through which other parts of our toolchain can further process code and allows things such as writing CSS-in-JS to be possible.

This configuration has been specifically tailored towards packages that are going to be published to Code Artifact, by using the @babel/runtime plugin to inject shims and polyfills for necessary features, in a way that can be shared with other packages when bundled in standalone apps. This will help reduce final bundle size in standalone apps, by avoiding having duplicated polyfills across our packages.

## Setting up a new project

To set up babel within a new package, there is a few steps to take. Start by installing this configuration as well as a peer dependency for `@babel/runtime-corejs3`:

```bash
> npm install --save-dev @tooling/babel-package-config
> npm install --save @babel/runtime-corejs3
```

Finally you'll need to extend the shared configuration, which is done by pasting the following snippet into `.babelrc.js` in the root of your package:

```js
module.exports = require("@tooling/babel-package-config/recommended");
```

That's it! 💫 Babel should now tie in with the rest of your tooling automatically.

[babel]: https://babeljs.io/

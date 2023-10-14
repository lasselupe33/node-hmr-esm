# Linaria

Standard tooling to add [linaria] to a project, with our pre-defined custom configuration.

## Table of Contents

- [Linaria](#linaria)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)

## Purpose of this tooling

Linaria enables writing CSS-in-JS with a zero runtime overhead, which means that static `.css` files will be emitted at build time containing our stylesheets. This enables tighter coupling of React components and their styles, which can both help prevent out-of-sync issues with e.g. timing of transitions as well as improve the developer experience by adding support for things such as IntelliSense.

## Setting up a new project

To set up linaria within a new project, there is a few steps to take. Start by installing this configuration:

```bash
> npm install --save-dev @tooling/linaria-config
```

Then you'll need to extend the shared configuration, which is done by pasting the following snippet into `.linariarc.js` in the root of your package:

```js
const withRecommendedConfig = require("@tooling/linaria-config/recommended");

module.exports = withRecommendedConfig({});
```

That's it! 💫 Linaria should now tie in with the rest of your tooling automatically.

[linaria]: https://linaria.dev/

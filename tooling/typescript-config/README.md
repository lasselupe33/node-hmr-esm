# TypeScript

Standard tooling to add [TypeScript] to a project, with our pre-defined custom configuration.

## Table of Contents

- [TypeScript](#typescript)
  - [Table of Contents](#table-of-contents)
  - [Purpose of this tooling](#purpose-of-this-tooling)
  - [Setting up a new project](#setting-up-a-new-project)

## Purpose of this tooling

TypeScript is being used to perform automatic type checking of code, to help increase confidence that a build is stable and correctly implemented across the entire codebase. Additionally it improves the developer experience by expanding on IntelliSense support while writing code.

We have decided to use a strict TypeScript configuration, so we can reap maximum benefits of the type-checks.

## Setting up a new project

To set up TypeScript within a new project, there is a few steps to take. Start by installing this package:

```bash
> npm install --save-dev @tooling/typescript-config
```

And then add a `type-check` script to your `package.json` as such:

```jsonc
{
  "name": "@gyldendal/my-package",
  // ...
  "scripts": {
    "type-check": "tsc -p tsconfig.json --noEmit",
  }
}
```

Finally you'll need to extend the shared configuration, which is done by pasting the following snippet into `tsconfig.json` in the root of your package:

```json
{
  "extends": "@tooling/typescript-config/recommended",
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

That's it! 💫 Most IDEs should now provide type validation in near-realtime and provide great IntelliSense support for your codebase. Furthermore type checking will automatically tie in to the rest of your tooling.

[TypeScript]: https://www.typescriptlang.org/

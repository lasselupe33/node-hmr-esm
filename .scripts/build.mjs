/**
 * utility script for `npm run build` to build a specific application based on
 * script input argument
 */

process.env.FORCE_COLOR = "1";

import { $ } from "zx";

const workspace = process.argv
  .slice(process.argv.findIndex((it) => it.startsWith("@")))
  .shift();

await $`npx turbo build --filter=${workspace}^...`;
$`npx turbo build:app --filter=${workspace}`;

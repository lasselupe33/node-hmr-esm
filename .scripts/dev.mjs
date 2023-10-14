/**
 * utility script for `npm run dev` to run a specific application in dev mode
 * based on script input argument
 */

process.env.FORCE_COLOR = "1";

import { $ } from "zx";

const workspaceIndex = process.argv.findIndex((it) => it.startsWith("@"));
const workspace =
  workspaceIndex === -1
    ? undefined
    : process.argv.slice(workspaceIndex).shift();

try {
  if (workspace) {
    await $`npx turbo build --filter=${workspace}^...`;
  } else {
    await $`npx turbo build`;
  }
} catch {
  // fail silently if builds fail.. We'll still get the errors once the dev mode
  // begins.
}

if (workspace) {
  $`npx turbo dev --filter=${workspace}^... --concurrency=100 --parallel`;
} else {
  $`npx turbo dev --concurrency=100 --parallel`;
}

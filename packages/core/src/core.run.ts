import path from "path";

import chalk from "chalk";
import enhancedResolve from "enhanced-resolve";

import { supportedExtensions } from "./utils";

export let restartIteration = 0;

// @todo how to import this in consumers?
declare global {
  // eslint-disable-next-line no-var
  var hmr:
    | {
        refresh: () => void;
        restart: () => void;
      }
    | undefined;
}

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

const entrypoint = resolver(
  process.cwd(),
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  process.env["NODE_HMR_ENTRYPOINT"]!
);

let cleanup: undefined | (() => Promise<void>);

globalThis.hmr = {
  async refresh() {
    console.info(
      `${chalk.cyan("[@node-hmr]")} refresh triggered. ${chalk.dim(
        "Re-running entrypoint."
      )}`
    );

    await run();
  },

  async restart() {
    console.info(
      `${chalk.cyan("[@node-hmr]")} restart triggered. ${chalk.dim(
        "Clearing module states and re-running entrypoint."
      )}`
    );

    restartIteration++;

    await run();
  },
};

export async function run() {
  if (!entrypoint) {
    throw new Error(
      `${chalk.cyan("@node/hmr")} Cannot resolve entrypoint, ${chalk.dim(
        `NODE_HMR_ENTRYPOINT=${
          process.env["NODE_HMR_ENTRYPOINT"]
        }, CWD=${process.cwd()}`
      )}`
    );
  }

  try {
    const segments = entrypoint.split(path.sep);

    console.info(
      `${chalk.cyan("[@node-hmr]")} ${chalk.dim(
        `Executing ${segments.slice(0, -3).join(path.sep)}`
      )}${path.sep}${segments.slice(-3).join(path.sep)}\n\n`
    );
    await cleanup?.();

    setTimeout(async () => {
      const { dispose } = await import(`${entrypoint}?bust=${Math.random()}`);

      cleanup = dispose;
    });
  } catch (err) {
    console.error(err);
    console.error(
      "[@node-hmr] Exception caught in entrypoint. To restart application hit any key."
    );
  }
}

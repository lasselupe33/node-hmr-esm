import path from "path";

import chalk from "chalk";
import enhancedResolve from "enhanced-resolve";

import { supportedExtensions } from "./constant.extensions";
import { handleUnexpectedError } from "./core.globals";

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

const entrypoint = (() => {
  try {
    return resolver(
      process.cwd(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env["NODE_HMR_ENTRYPOINT"]!
    );
  } catch {
    // err
  }
})();

const disposers = new Set<() => Promise<void> | void>();
let queue = Promise.resolve().catch((err) => {
  throw err;
});

export function run() {
  queue = queue.then(async () => {
    if (!entrypoint) {
      throw new Error(
        `${chalk.red("@node/hmr")} Cannot resolve entrypoint. ${chalk.dim(
          `NODE_HMR_ENTRYPOINT=${
            process.env["NODE_HMR_ENTRYPOINT"]
          }, CWD=${process.cwd()}`
        )}`
      );
    }

    try {
      const segments = entrypoint.split(path.sep);

      console.info(
        `${chalk.cyan("[node-hmr-esm]")} Executing ${chalk.dim(
          ` ${segments.slice(0, -3).join(path.sep)}`
        )}${path.sep}${segments.slice(-3).join(path.sep)}\n\n`
      );

      for (const dispose of disposers) {
        await dispose();
        disposers.delete(dispose);
      }

      const { dispose } = await import(`${entrypoint}?bust=${Math.random()}`);

      if (dispose && typeof dispose === "function") {
        disposers.add(dispose);
      }
    } catch (err) {
      if (err instanceof Error) {
        handleUnexpectedError(err);
      } else {
        console.error(err);
        process.exit(1);
      }
    }
  });
}

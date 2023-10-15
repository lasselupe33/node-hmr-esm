import path from "path";

import chalk from "chalk";
import enhancedResolve from "enhanced-resolve";

import { supportedExtensions } from "./constant.extensions";
import { handleUnexpectedError } from "./core.globals";

const DISPOSE_TIMEOUT_MS = 3_000;

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
  const startedAt = performance.now();

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
        )}${path.sep}${segments.slice(-3).join(path.sep)}`
      );

      for (const dispose of disposers) {
        await Promise.race([
          dispose(),
          new Promise((_, reject) =>
            setTimeout(() => {
              disposers.delete(dispose);

              reject(
                new Error(
                  `${chalk.red(
                    "[node-hmr-esm]"
                  )} Rejected long-running dispose function exceeding ${DISPOSE_TIMEOUT_MS}ms`
                )
              );
            }, DISPOSE_TIMEOUT_MS)
          ),
        ]);
        disposers.delete(dispose);
      }

      const { dispose } = await import(`${entrypoint}?bust=${Math.random()}`);
      const durationMs = performance.now() - startedAt;

      console.info(
        `${chalk.cyan("[node-hmr-esm]")} ${chalk.dim(
          `Executed in ${Math.round(durationMs * 100) / 100}ms`
        )}\n\n`
      );

      if (dispose && typeof dispose === "function") {
        disposers.add(dispose);
      }

      // Ensure that restarts are throttled at least 10ms between each restart
      // to ensure that dispose functions can keep up.
      await new Promise((resolve) => setTimeout(resolve, 10));
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

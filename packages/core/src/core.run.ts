import path from "path";
import { createInterface } from "readline/promises";

import chalk from "chalk";
import enhancedResolve from "enhanced-resolve";

import { supportedExtensions } from "./constant.extensions";

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

let cleanup: undefined | (() => Promise<void>);

export async function run() {
  if (!entrypoint) {
    throw new Error(
      `${chalk.red("@node/hmr")} Cannot resolve entrypoint. ${chalk.dim(
        `NODE_HMR_ENTRYPOINT=${
          process.env["NODE_HMR_ENTRYPOINT"]
        }, CWD=${process.cwd()}`
      )}`
    );
  }

  const controller = new AbortController();
  const onError = (error: Error) =>
    handleUnexpectedError(error, controller.signal);

  process.on("unhandledRejection", onError);
  process.on("uncaughtException", onError);

  try {
    const segments = entrypoint.split(path.sep);

    console.info(
      `${chalk.cyan("[@node-hmr]")} Executing ${chalk.dim(
        ` ${segments.slice(0, -3).join(path.sep)}`
      )}${path.sep}${segments.slice(-3).join(path.sep)}\n\n`
    );
    await cleanup?.();

    setTimeout(async () => {
      const { dispose } = await import(`${entrypoint}?bust=${Math.random()}`);

      cleanup = async () => {
        process.off("unhandledRejection", onError);
        process.on("uncaughtException", onError);
        controller.abort();

        await dispose?.();
      };
    });
  } catch (err) {
    if (err instanceof Error) {
      onError(err);
    } else {
      throw err;
    }
  }
}

const errorTerminalInterface = createInterface({
  input: process.stdin,
  output: process.stderr,
});

async function handleUnexpectedError(error: Error, abortSignal: AbortSignal) {
  console.error(error, "\n");

  // In case the error originated from this module, then we cannot recover
  // gracefully. As such we bail out.
  if (error.message.includes("@node/hmr")) {
    process.exit(1);
  }

  try {
    await errorTerminalInterface.question(
      `${chalk.red(
        "[@node-hmr]"
      )} Exception caught. To restart the application hit the 'Enter' key.`,
      { signal: abortSignal }
    );

    console.log("\n");

    await run();
  } catch {
    // silently fail if aborted
  }
}

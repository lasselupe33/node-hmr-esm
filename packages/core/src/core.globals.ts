import chalk from "chalk";

import { run } from "./core.run";

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

globalThis.hmr = {
  async refresh() {
    console.info(
      `${chalk.yellow("[node-esm-hmr]")} refresh triggered. ${chalk.dim(
        "Re-running entrypoint."
      )}`
    );

    run();
  },

  async restart() {
    console.info(
      `${chalk.yellow("[node-esm-hmr]")} restart triggered. ${chalk.dim(
        "Clearing module states and re-running entrypoint."
      )}`
    );

    restartIteration++;

    run();
  },
};

export function handleUnexpectedError(error: Error) {
  console.error(error, "\n");

  // In case the error originated from this module, then we cannot recover
  // gracefully. As such we bail out.
  if (error.message.includes("@node/hmr")) {
    process.exit(1);
  }

  console.error(
    `${chalk.red(
      "[node-esm-hmr]"
    )} Exception caught. To restart the application type 'rs' or 'restart'. To simply refresh the entrypoint type 'rf' or 'refresh'.`
  );

  console.log("\n");
}

process.on("unhandledRejection", handleUnexpectedError);
process.on("uncaughtException", handleUnexpectedError);

process.stdin.on("data", (data) => {
  const res = data.toString();

  switch (res) {
    case "rs\n":
    case "restart\n":
      globalThis.hmr?.restart();
      break;

    case "rf\n":
    case "refresh\n":
      globalThis.hmr?.refresh();
      break;
  }
});

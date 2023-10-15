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
      `${chalk.yellow("[node-hmr-esm]")} refresh triggered. ${chalk.dim(
        "Re-running entrypoint."
      )}`
    );

    run();
  },

  async restart() {
    console.info(
      `${chalk.yellow("[node-hmr-esm]")} restart triggered. ${chalk.dim(
        "Clearing module states and re-running entrypoint."
      )}`
    );

    restartIteration++;

    run();
  },
};

export function handleUnexpectedError(error: Error) {
  console.error(error, "\n");

  console.error(
    `${chalk.red(
      "[node-hmr-esm]"
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

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

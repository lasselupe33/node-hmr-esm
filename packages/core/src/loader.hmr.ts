import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";

import { restartIteration } from "./core.globals";
import { run } from "./core.run";
import { resolveURL } from "./util.url.resolve";

type FilePath = string;

const encounteredFiles = new Set();
const fileLastModifiedAt = {} as Record<FilePath, number | undefined>;
const dependencyMap = new Map<FilePath, Set<FilePath>>();

export async function resolve(
  specifier: string,
  context: {
    conditions: string[];
    parentURL: string | undefined;
    format?: string;
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: (...args: unknown[]) => Promise<{}>
) {
  const resolved = resolveURL(specifier, context.parentURL);

  if (
    !resolved.resolved ||
    !resolved.url ||
    resolved.url.pathname.includes("node_modules")
  ) {
    return next(specifier, context);
  }

  // Track dependencies
  (() => {
    const parentPathname = context.parentURL
      ? new URL(context.parentURL).pathname
      : undefined;

    if (!parentPathname) {
      return;
    }

    const base = dependencyMap.get(parentPathname) ?? new Set<FilePath>();
    base.add(resolved.url.pathname);

    dependencyMap.set(parentPathname, base);
  })();

  const lastModifedAt =
    fileLastModifiedAt[resolved.url.pathname] ||
    (await fs.promises.stat(resolved.url.pathname)).mtimeMs;

  resolved.url.searchParams.set("mtime", `${lastModifedAt}`);

  resolved.url.searchParams.set("iteration", `${restartIteration}`);

  for (const dependency of dependencyMap.get(resolved.url.pathname) ?? []) {
    resolved.url.searchParams.set(
      dependency,
      `${fileLastModifiedAt[dependency] ?? 0}`
    );
  }

  return {
    format: context.format || "module",
    shortCircuit: true,
    url: resolved.url.href,
  };
}

export async function load(
  specifier: string,
  context: {
    format: string;
    conditions: string[];
    parentURL: string;
    source?: string;
  },
  next: (...args: unknown[]) => void
) {
  if (context.format !== "module") {
    return next(specifier, context);
  }

  const url = new URL(specifier);

  if (url.pathname.includes("node_modules")) {
    return next(specifier, context);
  }

  if (!encounteredFiles.has(url.pathname)) {
    encounteredFiles.add(url.pathname);

    fileLastModifiedAt[url.pathname] = (
      await fs.promises.stat(url.pathname)
    ).mtimeMs;

    fs.watch(url.pathname, async () => {
      const nextModifiedAt = (await fs.promises.stat(url.pathname)).mtimeMs;

      if (fileLastModifiedAt[url.pathname] !== nextModifiedAt) {
        const segments = url.pathname.split(path.sep);

        console.info(
          `${chalk.cyan("[node-esm-hmr]")} detected change in ${chalk.dim(
            `${segments.slice(0, -3).join(path.sep)}`
          )}${path.sep}${segments.slice(-3).join(path.sep)}. ${chalk.dim(
            "Clearing module state and re-running entrypoint."
          )}`
        );

        run();
      }

      fileLastModifiedAt[url.pathname] = nextModifiedAt;
    });
  }

  return {
    format: "module",
    shortCircuit: true,
    source: context.source || (await fs.promises.readFile(url.pathname)),
  };
}

setTimeout(run, 0);

import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";

import { run } from "./core.run";
import { resolveURL } from "./util.url.resolve";

type FilePath = string;

const encounteredFiles = new Set();
const fileIteration = {} as Record<FilePath, number | undefined>;
const fileModifiedAtMs = {} as Record<FilePath, number | undefined>;
const parentsMap = new Map<FilePath, Set<FilePath>>();

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

    const base = parentsMap.get(resolved.url.pathname) ?? new Set<FilePath>();
    base.add(parentPathname);

    parentsMap.set(resolved.url.pathname, base);
  })();

  resolved.url.searchParams.set(
    "iteration",
    `${fileIteration[resolved.url.pathname] || 0}`
  );

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
    fileIteration[url.pathname] ??= 0;
    fileModifiedAtMs[url.pathname] = (
      await fs.promises.stat(url.pathname)
    ).mtimeMs;

    const onFileChange = async () => {
      const nextModifiedAt = (await fs.promises.stat(url.pathname)).mtimeMs;

      if (fileModifiedAtMs[url.pathname] !== nextModifiedAt) {
        fileModifiedAtMs[url.pathname] = nextModifiedAt;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fileIteration[url.pathname]! += 1;

        const ancestors = getTransitiveParents(url.pathname);

        for (const parent of ancestors) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          fileIteration[parent]! += 1;
        }

        const segments = url.pathname.split(path.sep);

        console.info(
          `${chalk.cyan("[node-hmr-esm]")} detected change in ${chalk.dim(
            `${segments.slice(0, -3).join(path.sep)}`
          )}${path.sep}${segments.slice(-3).join(path.sep)}. ${chalk.dim(
            `(${ancestors.size})`
          )}`
        );

        run();
      }
    };

    fs.watch(url.pathname, onFileChange);
  }

  return {
    format: "module",
    shortCircuit: true,
    source: context.source || (await fs.promises.readFile(url.pathname)),
  };
}

setTimeout(run, 0);

export function getTransitiveParents(
  path: string,
  foundParents = new Set<string>()
) {
  for (const parent of parentsMap.get(path) ?? []) {
    if (foundParents.has(parent)) {
      continue;
    }

    foundParents.add(parent);
    getTransitiveParents(parent, foundParents);
  }

  return foundParents;
}

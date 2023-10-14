import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";
import enhancedResolve from "enhanced-resolve";

import { restartIteration, run } from "./core.run";
import { transform } from "./core.transform";
import { moduleExtensions, supportedExtensions } from "./utils";

type FilePath = string;

const encounteredFiles = new Set();
const fileLastModifiedAt = {} as Record<FilePath, number | undefined>;
const dependencyMap = new Map<FilePath, Set<FilePath>>();

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

export async function resolve(
  specifier: string,
  context: { conditions: string[]; parentURL: string | undefined },
  // eslint-disable-next-line @typescript-eslint/ban-types
  next: (...args: unknown[]) => Promise<{}>
) {
  const resolved = (() => {
    const parentPath = context.parentURL
      ? path.dirname(new URL(context.parentURL).pathname)
      : undefined;

    try {
      const resolved = resolver(
        parentPath ?? process.cwd(),
        specifier.replace("file://", "")
      );

      if (!resolved) {
        return { resolved: false };
      }

      return { resolved: true, url: new URL(`file://${resolved}`) };
    } catch (err) {
      return { resolved: false };
    }
  })();

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

  resolved.url.searchParams.set(
    "mtime",
    `${fileLastModifiedAt[resolved.url.pathname] ?? 0}`
  );

  resolved.url.searchParams.set("iteration", `${restartIteration}`);

  for (const dependency of dependencyMap.get(resolved.url.pathname) ?? []) {
    resolved.url.searchParams.set(
      dependency,
      `${fileLastModifiedAt[dependency] ?? 0}`
    );
  }

  const format = moduleExtensions.some((ext) =>
    resolved.url.pathname.endsWith(ext)
  )
    ? "module"
    : "esbuild";

  return {
    format,
    shortCircuit: true,
    url: resolved.url.href,
  };
}

export async function load(
  specifier: string,
  context: { format: string; conditions: string[]; parentURL: string },
  next: (...args: unknown[]) => void
) {
  if (context.format !== "esbuild" && context.format !== "module") {
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

    fs.watch(url.pathname, async (type) => {
      if (type !== "change") {
        return;
      }

      const nextModifiedAt = (await fs.promises.stat(url.pathname)).mtimeMs;

      if (fileLastModifiedAt[url.pathname] !== nextModifiedAt) {
        const segments = url.pathname.split(path.sep);

        console.info(
          `${chalk.cyan("[@node-hmr]")} ${chalk.dim(
            `${segments.slice(0, -3).join(path.sep)}`
          )}${path.sep}${segments
            .slice(-3)
            .join(path.sep)} changed. ${chalk.dim(
            "Clearing module state and re-running entrypoint."
          )}`
        );

        run();
      }

      fileLastModifiedAt[url.pathname] = nextModifiedAt;
    });
  }

  if (context.format === "esbuild") {
    const transformed = await transform(url.pathname);

    return {
      format: "module",
      shortCircuit: true,
      source: transformed,
    };
  } else {
    return {
      format: "module",
      shortCircuit: true,
      source: await fs.promises.readFile(url.pathname),
    };
  }
}

setTimeout(run, 0);

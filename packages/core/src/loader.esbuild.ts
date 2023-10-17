import fs from "fs";
import path from "path";

import esbuild from "esbuild";

import {
  nodeSupportedExtensions,
  supportedExtensions,
} from "./constant.extensions";
import { resolveURL } from "./util.url.resolve";

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

  const requiresESBuild = !nodeSupportedExtensions.some(
    (ext) => resolved.url?.pathname.endsWith(ext)
  );

  if (
    !resolved.resolved ||
    !resolved.url ||
    resolved.url.pathname.includes("node_modules") ||
    !requiresESBuild
  ) {
    return next(specifier, context);
  }

  return next(resolved.url.href, {
    ...context,
    format: "esbuild",
  });
}

export async function load(
  specifier: string,
  context: { format: string; conditions: string[]; parentURL: string },
  next: (...args: unknown[]) => void
) {
  if (context.format !== "esbuild") {
    return next(specifier, context);
  }

  const url = new URL(specifier);

  if (url.pathname.includes("node_modules")) {
    return next(specifier, context);
  }

  const transformed = await transform(url.pathname);

  return next(specifier, {
    ...context,
    format: "module",
    source: transformed,
  });
}

const cache = new Map<
  string,
  { modifiedAtMs: number; source: Promise<string | undefined> }
>();

async function transform(filePath: string): Promise<string | undefined> {
  const modifiedAt = (await fs.promises.stat(filePath)).mtimeMs;

  const cached = cache.get(filePath);

  if (modifiedAt === cached?.modifiedAtMs) {
    return await cached.source;
  }

  const sourcePromise = esbuild
    .build({
      // @todo implement pre stage that collects all entrypoints so we can do
      // this once instead of multiple times.
      entryPoints: [filePath],
      outdir: path.dirname(filePath),
      format: "esm",
      target: "node18",
      resolveExtensions: supportedExtensions,
      bundle: false,
      write: false,
      jsx: "automatic",
      jsxDev: true,
      plugins: [externalCjsToEsmPlugin],
    })
    .then((transformed) => transformed.outputFiles[0]?.text);

  cache.set(filePath, {
    modifiedAtMs: modifiedAt,
    source: sourcePromise,
  });

  return await sourcePromise;
}

/**
 * naïve transpilation of CJS modules to ESM based on ESBuild discussion.
 * See https://github.com/evanw/esbuild/issues/566#issuecomment-735551834
 */
const externalCjsToEsmPlugin: esbuild.Plugin = {
  name: "cjsToEsm",
  setup(build) {
    build.onResolve({ filter: /.*/, namespace: "external" }, (args) => ({
      path: args.path,
      external: true,
    }));
    build.onResolve({ filter: /.cjs$/ }, (args) => ({
      path: args.path,
      namespace: "external",
    }));
    build.onLoad({ filter: /.*/, namespace: "external" }, (args) => ({
      contents: `export * from ${JSON.stringify(args.path)}`,
    }));
  },
};

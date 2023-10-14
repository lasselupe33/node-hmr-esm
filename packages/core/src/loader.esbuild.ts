import path from "path";

import esbuild from "esbuild";

import { moduleExtensions, supportedExtensions } from "./constant.extensions";
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

  const requiresESBuild = !moduleExtensions.some(
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

async function transform(filePath: string): Promise<string | undefined> {
  const transformed = await esbuild.build({
    // @todo implement pre stage that collects all entrypoints so we can do
    // this once instead of multiple times.
    entryPoints: [filePath],
    outdir: path.dirname(filePath),
    format: "esm",
    target: "node18",
    resolveExtensions: supportedExtensions,
    bundle: false,
    write: false,
  });

  return transformed.outputFiles[0]?.text;
}

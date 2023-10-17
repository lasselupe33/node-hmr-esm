import fs from "fs";
import path from "path";

import esbuild from "esbuild";

import { supportedExtensions } from "./constant.extensions";

const cache = new Map<
  string,
  { modifiedAtMs: number; source: Promise<string | undefined> }
>();

export async function transformSource(
  filePath: string
): Promise<string | undefined> {
  const modifiedAt = (await fs.promises.stat(filePath)).mtimeMs;

  const cached = cache.get(filePath);

  if (modifiedAt === cached?.modifiedAtMs) {
    return await cached.source;
  }

  const sourcePromise = esbuild
    .build({
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

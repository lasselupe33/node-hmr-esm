import path from "path";

import { supportedExtensions } from "@node-hmr/utils";
import esbuild from "esbuild";

export async function transform(filePath: string): Promise<string | undefined> {
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

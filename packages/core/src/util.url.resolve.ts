import path from "path";

import enhancedResolve from "enhanced-resolve";

import { supportedExtensions } from "./constant.extensions";

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

export function resolveURL(specifier: string, parentURL: string | undefined) {
  const parentPath = parentURL
    ? path.dirname(new URL(parentURL).pathname)
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
}

import { nodeSupportedExtensions } from "./constant.extensions";
import { transformSource } from "./util.transform-source";
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

  const transformed = await transformSource(url.pathname);

  return next(specifier, {
    ...context,
    format: "module",
    source: transformed,
  });
}

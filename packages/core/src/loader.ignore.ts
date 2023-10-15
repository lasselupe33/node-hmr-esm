import { resolveURL } from "./util.url.resolve";

const IGNORED_EXTENSIONS = [".css", ".scss"];

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

  const ignore = IGNORED_EXTENSIONS.some(
    (ext) => resolved.url?.pathname.endsWith(ext)
  );

  if (!resolved.resolved || !resolved.url || !ignore) {
    return next(specifier, context);
  }

  return {
    format: "ignore",
    url: resolved.url.href,
    shortCircuit: true,
  };
}

export async function load(
  specifier: string,
  context: { format: string; conditions: string[]; parentURL: string },
  next: (...args: unknown[]) => void
) {
  if (context.format !== "ignore") {
    return next(specifier, context);
  }

  return {
    format: "module",
    source: "export {}",
    shortCircuit: true,
  };
}

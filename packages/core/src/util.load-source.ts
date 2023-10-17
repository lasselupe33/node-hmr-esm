import fs from "fs";

const cache = new Map<
  string,
  { modifiedAtMs: number; source: Promise<Buffer | undefined> }
>();

export async function loadSource(
  filePath: string
): Promise<Buffer | undefined> {
  const modifiedAt = (await fs.promises.stat(filePath)).mtimeMs;

  const cached = cache.get(filePath);

  if (modifiedAt === cached?.modifiedAtMs) {
    return await cached.source;
  }

  const sourcePromise = fs.promises.readFile(filePath);

  cache.set(filePath, {
    modifiedAtMs: modifiedAt,
    source: sourcePromise,
  });

  return await sourcePromise;
}

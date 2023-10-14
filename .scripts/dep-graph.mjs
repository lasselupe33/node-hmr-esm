import { $ } from "zx";

const graph = await $`npx turbo run build --graph`; // --filter=@bm/clientside-css-utils...`;

const trimmedTooling = graph.stdout.replace(/@tooling\/.*?#build/g, "@tooling");

const cache = new Set();

const deduped = trimmedTooling
  .split("\n")
  .filter((it) => {
    if (cache.has(it) || it.includes(`@tooling" -> "[root] @tooling`)) {
      return false;
    }

    cache.add(it);
    return true;
  })
  .join("\n");

console.log(deduped);

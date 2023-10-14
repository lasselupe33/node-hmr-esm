function withRecommendedConfig(projectRoot, linariaConfig = {}) {
  return {
    classNameSlug: (hash, title) =>
      process.env.NODE_ENV === "production"
        ? `${tinyHash(projectRoot)}${hash}`
        : `${title}__${tinyHash(projectRoot)}_${hash}`,

    ...linariaConfig,
  };
}

module.exports = withRecommendedConfig;

/**
 * genereate a tiny hash based on the projectRoot so we greatly reduce the
 * risk of having namespace collisions for classnames across workspaces within
 * the monorepo
 *
 * @see https://gist.github.com/jedp/3166329
 */
function tinyHash(string) {
  const m = Math.pow(10, 4 + 1) - 1;
  const phi = Math.pow(10, 4) / 2 - 1;
  let n = 0;
  for (let i = 0; i < string.length; i++) {
    n = (n + phi * string.charCodeAt(i)) % m;
  }
  return n.toString(36);
}

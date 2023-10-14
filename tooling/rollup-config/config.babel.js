const path = require("path");

const { DEFAULT_EXTENSIONS } = require("@babel/core");
const linariaCore = require("@linaria/rollup").default;
const { babel } = require("@rollup/plugin-babel");
const json = require("@rollup/plugin-json");
const nodeResolve = require("@rollup/plugin-node-resolve");
const MagicString = require("magic-string");

const withCommonConfig = require("./config.common");

/**
 * @param {string} projectRoot
 * @param {Partial<import('rollup').RollupOptions>} rollupConfig
 * @returns {import('rollup').RollupOptions}
 */
function withBabelConfig(projectRoot, rollupConfig = {}) {
  return withCommonConfig(projectRoot, {
    ...rollupConfig,

    plugins: [
      json({ namedExports: false }),
      linaria(projectRoot, {
        sourceMap: true,

        // @linaria/rollup is incompatible with @rollup/plugin-json (or
        // rather, it will still try and fail to parse json files)
        //
        // issue is fixed by simply asking linaria not to touch json files, as
        // we know for sure that they do not contain css anyway
        //
        // IMPORTANT: also make sure to ignore any files located inside
        // node_modules folder
        ignore: /(\/node_modules\/.+)|(\.json)$/i,
      }),
      css(),
      babel({
        babelHelpers: isNodeModuleInstalled(
          "@tooling/babel-package-config/recommended"
        )
          ? "runtime"
          : "bundled",
        extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
      }),
      nodeResolve({
        extensions: [".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"],
      }),
      ...(rollupConfig.plugins ?? []),
    ],
  });
}

module.exports = withBabelConfig;

/**
 * due to certain incompatabilities between linaria and rollup, we need to
 * make sure that node_modules are correctly resolved before returning to the
 * linaria babel plugin to avoid ENOENT errors
 *
 * the following abstraction on top of the raw linaria rollup plugin makes this
 * possible, by overriding the "resolve" method exposed by rollup itself, and
 * then checking to see if the module path can be resolved through the default
 * node.js module resolution
 *
 * the implementation is unobtrusive to the rest of the rollup ecosystem, as it
 * works by overriding the resolve method explicitly when triggering the
 * linaria transformer
 *
 * additionally it solves an issue with linaria plugin in watch mode, which
 * could trigger unwarrented errors with the message:
 * "The expression evaluated to 'undefined', which is probably a mistake."
 *
 * this is fixed by re-creating the plugin every time a change occurs in watch
 * mode, in order to suppress caching which risks becoming stale when used in
 * conjunction with other plugins
 *
 * @param {Parameters<typeof import("@linaria/rollup").default>[0]} config
 */
function linaria(projectRoot, config) {
  const plugin = {
    current: linariaCore(config),
  };
  const loadCache = new Map();

  return {
    name: plugin.current.name,

    watchChange() {
      // due to a bug in linaria's current cache implementation, we need to
      // make sure that the plugin is re-created every time a change happens in
      // watch mode
      //
      // this forces linaria to re-evaluate all source files, and prevents the
      // bug from happening
      plugin.current = linariaCore(config);
    },

    load(id) {
      let result = plugin.current.load.call(this, id);

      if (result) {
        // if we get a result, then cache it for subsequent usage
        loadCache.set(id, result);
      } else {
        // ... otherwise scan our cache for results
        //
        // this is necessary due to the fact that we re-create the linaria
        // plugin itself, and therefore loose access to their built-in caching
        // of cssLookups
        result = loadCache.get(id);
      }

      return result;
    },

    async resolveId(...args) {
      return plugin.current.resolveId.call(this, ...args);
    },
    async transform(...args) {
      return await plugin.current.transform.call(
        {
          ...this,
          resolve: async (...args) => {
            const resolved = await this.resolve(...args);

            if (!resolved) {
              return null;
            }

            try {
              return {
                ...resolved,
                id: require.resolve(resolved.id, {
                  paths: [
                    ...require.resolve.paths(projectRoot),
                    path.resolve(projectRoot, "node_modules"),
                  ],
                }),
              };
            } catch (err) {
              return resolved;
            }
          },
        },
        ...args
      );
    },
  };
}

/**
 * custom rollup plugin used to extract css from linaria to plain .css-files
 * and then auto-import them from JavaScript
 *
 * this ensures that we support tree shaking and code splitting when publishing
 * large packages for external consumption
 */
function css() {
  const cssAssets = new Map();

  return {
    name: "css",

    /**
     * rollup doesn't natively support handling css, so instead save css source
     * in an in-memory map which we'll use to emit css as assets later, and
     * transform the content of the file to an empty string within the context
     * of rollup, so we avoid having syntax errors thrown
     */
    transform(source, id) {
      if (id.match(/_[^_]+\.css$/)) {
        cssAssets.set(getCssFileNameWithoutSlug(id), { source, id });
        return "";
      }
    },

    /**
     * every time a chunk is rendered, we check to see if it contained
     * CSS-in-JS code - and in that case, we make sure the css is emitted as a
     * standalone file that is then auto-imported from the JS file for easy
     * third-party consumption and tree shaking
     */
    renderChunk(code, chunk, options) {
      const cssAsset = cssAssets.get(
        getModuleFileNameWithoutExtension(chunk.facadeModuleId)
      );

      if (!cssAsset) {
        // if this chunk didn't emit any css, then let rollup render it without
        // further manipulation
        return null;
      }

      // ... otherwise emit the css as an external asset so it can be loaded
      // directly in a browser
      const outputFileName =
        getModuleFileNameWithoutExtension(chunk.fileName) + ".linaria.css";

      this.emitFile({
        type: "asset",
        fileName: outputFileName,
        source: cssAsset.source,
      });

      // ... and auto-import the emitted css asset from the JS file, so the only
      // requirement for consumers is to implement a css loader to enable
      // fully styled components with full code splitting support
      const s = new MagicString(code);
      s.append(
        `\nrequire(${JSON.stringify(`./${path.basename(outputFileName)}`)});`
      );

      return {
        code: s.toString(),
        map: options.sourcemap ? s.generateMap({ hires: true }) : null,
      };
    },
  };

  function getModuleFileNameWithoutExtension(moduleId) {
    return moduleId.replace(/\.[^.]*$/, "");
  }

  /**
   * @linaria/rollup emits css files using a _[slug].css extension; this utility
   * removes that extension, so we get only the basename without extension of
   * the module that emitted the asset
   */
  function getCssFileNameWithoutSlug(moduleId) {
    return moduleId.replace(/_[^_]+\.css$/, "");
  }
}

/**
 * simple utility to safely determine if a node_module has been installed in
 * the current project, by trying to resolve it and checking if that causes
 * issues with the node.js resolver
 */
function isNodeModuleInstalled(moduleId) {
  try {
    require.resolve(moduleId);
    return true;
  } catch (err) {
    return false;
  }
}

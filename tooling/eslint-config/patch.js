/**
 * ESLint isn't great at running within a monorepo where a common configuration
 * has been installed from an internal package
 *
 * Luckily Rush has found a fix for this, by implementing a patch for ESLint's
 * module resolution strategy to make it compatible with monorepo setups
 */

// eslint-disable-next-line import/no-extraneous-dependencies
require("@rushstack/eslint-patch/modern-module-resolution");

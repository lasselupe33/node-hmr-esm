#!/usr/bin/env bash
PACKAGE_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

NODE_HMR_ENTRYPOINT='$1' node  --loader $PACKAGE_DIR/lib/loader.hmr.mjs --loader $PACKAGE_DIR/lib/loader.esbuild.mjs  --loader $PACKAGE_DIR/lib/loader.ignore.mjs $PACKAGE_DIR/lib/empty.mjs

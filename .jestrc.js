switch (process.env.JEST_SPEC) {
  case "unit":
    module.exports = require("@tooling/jest-config/recommended.unit")({});
    break;

  case "narrow":
    module.exports = require("@tooling/jest-config/recommended.narrow")({});
    break;

  case "broad":
    module.exports = require("@tooling/jest-config/recommended.broad")({});
    break;

  case "vscode":
    module.exports = require("@tooling/jest-config/recommended.vscode")({});
    break;
}

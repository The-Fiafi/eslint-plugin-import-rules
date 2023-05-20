const semicolonAfterImport = require("./rules/semicolon-after-import")
const importCombination = require("./rules/import-combination")

module.exports = {
    rules: {
        "semicolon-after-import": semicolonAfterImport,
        "import-combination": importCombination
    }
}


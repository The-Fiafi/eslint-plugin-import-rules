module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Semicolon after import",
        },
        fixable: "code",
        schema: []
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        return {
          ImportDeclaration(node) {
                if (sourceCode.getLastToken(node).value === ";") return {}

                context.report({
                    node,
                    message: 'the import must end with ;',
                    fix: (fixer) => fixer.insertTextAfter(node, ";")
              })
          }
        }
    }
}
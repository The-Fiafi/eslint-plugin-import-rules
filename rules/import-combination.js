module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Sorting import",
        },
        fixable: "code",
        schema: []
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        const getNodePosition = (node) => [node.loc.start.line - 1, node.loc.end.line - 1]

        const isHook = (specifiers) => specifiers.reduce((acc, specifier) => specifier.local.name.slice(0, 3) === "use" && specifier.local.name.slice(3, 4) === specifier.local.name.slice(3, 4).toUpperCase() || specifier.parent.source.value === "react" || acc, false)

        const isStyle = (specifiers) => !specifiers.length

        const isComponent = (specifiers) =>
            specifiers.reduce((acc, specifier) => {
                const name = specifier.local.name
        
                if (name.toLowerCase() === "react") return false
                if (name[0] === name[0].toUpperCase()) return true
        
                return false
            }, false)
      
        const isSimilar = (node, bodyNode) => {
            let isSimilar = false
        	
            const getImportPathByNode = (el) => el.source.raw.slice(1, -1).replace(/\./g, "").split("/")
       
            const bodyNodeImportedFilePath = getImportPathByNode(bodyNode)
            const nodeImportedFilePath = getImportPathByNode(node)
        
            for (let pathSlice of bodyNodeImportedFilePath) {
                if (pathSlice && nodeImportedFilePath.includes(pathSlice)) {
                    isSimilar = true
            
                    break
                }
            }
      
            return isSimilar
        }
    
        const getTokenOnTheSides = (node) => {
            const nodeRangeIndex = getNodePosition(node)[0]
        	
            const topElement = sourceCode.lines[nodeRangeIndex - 1] || ""
            const bottomElement = sourceCode.lines[nodeRangeIndex + 1] || ""
			
            const output = {
                topNode: topElement,
                bottomNode: bottomElement
            }

            const addNodeHelper = (numb) => {
              	let index
              
              	if (numb > 0) {
                	const commentsAfter = sourceCode.getCommentsAfter(node)
                    const nodeWithComments = [node, ...commentsAfter]
                    
                    index = getNodePosition(nodeWithComments[nodeWithComments.length - 1])[0]
                }else {
                	const commentsBefore = sourceCode.getCommentsBefore(node)
                    const nodeWithComments = [...commentsBefore, node]
                    
                    index = getNodePosition(nodeWithComments[0])[0]  
                }
    
                const nodeRange = sourceCode.lineStartIndices[index + numb < 0 ? nodeRangeIndex : index + numb]
                const newNode = sourceCode.getNodeByRangeIndex(nodeRange)
        		
                const nodeType = numb > 0 ? "bottomNode" : "topNode"
        		
                if (newNode.type === "ImportDeclaration") return (output[nodeType] = newNode)
        
                output[nodeType] = ""
            }
      
            if (topElement && topElement.trim()) addNodeHelper(-1)
            if (bottomElement && bottomElement.trim()) addNodeHelper(1)
      		
            return output
        }
    
        const fix = (node, fixer) => {
            const fixing = []
            const nodesGroups = {
                hooks: [],
                else: [],
                styles: [],
                components: []
            }
      
            const bodyNodes = node.parent.body
            const fixingStartRange = []
            let firstNotImportNode
      
            bodyNodes.forEach((bodyNode) => {
                if (bodyNode.type === "ImportDeclaration") {
                    const commentsBefore = sourceCode.getCommentsBefore(bodyNode)
                    const comp = [...commentsBefore, bodyNode]
            
                    if (isHook(bodyNode.specifiers)) nodesGroups.hooks.push(comp)
                    else if (isStyle(bodyNode.specifiers)) nodesGroups.styles.push(comp)
                    else if (isComponent(bodyNode.specifiers)) nodesGroups.components.push(comp)
                    else nodesGroups.else.push(comp)
            
                    const range = [comp[0].range[0], bodyNode.range[1]]
                    const { topNode, bottomNode } = getTokenOnTheSides(bodyNode)
            	
                    if (typeof topNode === "string" && !topNode.trim()) {
                        if (range[0] - 1 >= 0) range[0] -= 1
                    }
          
                    fixingStartRange.push(range)
                } else if (!firstNotImportNode) {
                    firstNotImportNode = bodyNode
                }
            })
      
          	const pageEnd = node.parent.range[1]
            const endDeleteRange = (firstNotImportNode && firstNotImportNode.range[0] - 1) || pageEnd
          
            fixingStartRange.forEach((range) => {
                if (range[1] <= endDeleteRange) return
   
                fixing.push(fixer.removeRange(range))
            })
            
            fixing.push(fixer.removeRange([0, endDeleteRange]))
            
            const getImportStringFromArray = (nodeArr, deep) => {
                let output = ""
        
                const groupImportAsString = (nodeArr) => {
                    nodeArr.forEach((arr) => {
                        const el = arr[arr.length - 1]
                        const [start, end] = getNodePosition(el)
            			
                        if (arr.length > 1) {
                            for (let i = 0; i < arr.length - 1; i++) {
                                output += `\n//${arr[i].value}`
                            }
                        }
            
                        if (start !== end) {
                            for (let i = start; i < end + 1; i++) {
                                output += `\n${sourceCode.lines[i]}`
                            }
              
                            return
                        }
            
                        output += `\n${sourceCode.lines[start]}`
                    })
                }
        
                if (deep) {
                    const group = []
            
                    nodeArr.forEach((el) => {
                        if (!group.length) return group.push([el])
                        
                        const arrClone = [...group]
                        let isAdded

                        arrClone.forEach((groupEl, i) => {
                          	
                          	const mainNode = el[el.length - 1]
                            const groupElNode = groupEl[groupEl.length - 1]
                            
                            if (isSimilar(groupElNode[groupElNode.length - 1], mainNode)) {
                                group[i].push(el)
                
                                isAdded = true
                            }
                        })
                
                        if (!isAdded) group.push([el])
                    })
          
                    group.forEach((groupEl) => {
                        groupImportAsString(groupEl)
            
                        output += `\n`
                    })
          
                    output = output.slice(0, -1)
                }else groupImportAsString(nodeArr)
        
                return output.slice(1)
            }
            
            let importString = ""
      
            Object.keys(nodesGroups).forEach(key => {
            	if (!nodesGroups[key].length) return 
 	
            	importString +=`${getImportStringFromArray(nodesGroups[key], key === "else")}\n\n`
            })
            console.log(fixing, fixer.insertTextBeforeRange([importString.length], importString), importString.length)
            return [...fixing, fixer.insertTextBeforeRange([importString.length - 2], importString)]
        }

        return {
            ImportDeclaration(node) {
                const { topNode, bottomNode } = getTokenOnTheSides(node)
        
                const isEqual = (bodyNode) => {
                    if (isHook(node.specifiers)) {
                        if (isHook(bodyNode.specifiers)) return true
                    } else if (isComponent(node.specifiers)) {
                        if (isComponent(bodyNode.specifiers)) return true
                    }else if (isStyle(node.specifiers)) {
                      	if (isStyle(bodyNode.specifiers)) return true
                    }else {
                        if (isSimilar(node, bodyNode)) return true
                    }
                  
                    return false
                }
        		
                if (!topNode && !bottomNode) {
                    const similar = []
            
                    node.parent.body.forEach((bodyNode) => {
                        if (bodyNode.start === node.start || bodyNode.type !== "ImportDeclaration") return
            
                        if (isEqual(bodyNode)) similar.push(bodyNode)
                    })
          
                    if (similar.length) {
         

                        context.report({
                            node,
                            message: "Similar imports should be combined",
                            fix: fix.bind(null, node)
                        })
                    }
                }    
        
                if (topNode) {
                    if (isEqual(topNode)) return
  
                    context.report({
                        node,
                        message: "Similar imports should be combined",
                        fix: fix.bind(null, node)
                    })
                }
                    
                if (bottomNode) {
                    if (isEqual(bottomNode)) return
         
                    context.report({
                        node,
                        message: "Similar imports should be combined",
                        fix: fix.bind(null, node)
                    })
                }
            }
        }
    }
}
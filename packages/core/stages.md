Prepare:
Stages:

Per file:

shake(fileName, parentName, entrypoints)

if (fileContents !== prevContents) {
ast = Convert source code file -> AST
} else {
ast = cachedAST
}

-- STEP --

if (newEntrypoints === previousEntrypoints) {
return previous list of reachable nodes
} else if (newEntrypoints is missing one or more of previousEntryPoints) {
return newly gathered list of reachable nodes
} else {
return list of reachable nodes, starting with cached reachable nodes
}

-- STEP --

if (newListOfReachableNodes === previousListOfReachableNodes) {
return printed code
} else {
ast = clonedAST()
removeIrrelevantNodes(ast)
return ast.toSourceCode()
}

-- STEP --

const newCssOutput = re-run entrypoint()

for (const entry of newCssOutput) {
if (entry !== prevEntry) {
emit(entry);
}
}

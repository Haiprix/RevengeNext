export function findInReactTree(
    tree: any,
    predicate: (node: any) => boolean,
): any {
    if (!tree || typeof tree !== "object") return undefined;

    if (predicate(tree)) {
        return tree;
    }

    const children = tree.props?.children;

    if (Array.isArray(children)) {
        for (const child of children) {
            const result = findInReactTree(child, predicate);
            if (result) return result;
        }
    } else if (children && typeof children === "object") {
        const result = findInReactTree(children, predicate);
        if (result) return result;
    }

    return undefined;
}
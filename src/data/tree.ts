// This is the Tree data structure, irrelavent to rendering

// Because 
// 1. Arco Form cannot handle objects that contains loop, and we don't want additional internal state,
// 2. for simplicity
// we don't store parent in the node, but compute & provide during rendering

// Supported opertions: 
// - Add leaf to branch
// - Shift leaf: insert a branch before leaf
// - Delete a non-root node; move its children to its parent (if any children), or give its parent a new leaf (if no children)
//   which implements both
//   - Delete leaf. If parent is empty, fill an leaf
//   - Delete branch (non-root), and move its children to its parents


export type BranchNode<T = any> = {
  data: T,
  children: TreeNode[],
  // parent?: BranchNode, // only root's parent is undef
}
export type LeafNode<T = any> = {
  data: T,
  // Consider children: [] to unify both types
  // parent?: BranchNode, // only root's parent is undef
}
export type TreeNode<TBranch = any, TLeaf = any> = BranchNode<TBranch> | LeafNode<TLeaf>;
export type NodePath = number[];
export type Parent = BranchNode | null;


/** 
 * Add a leaf to a branch 
 * B-[L1,L2] -> B-[L1,L2,L*]
 */
export function addLeaf<TLeaf>(node: BranchNode, parent: Parent, leafData: TLeaf) {
  node.children.push({ data: leafData });
}

/** 
 * Insert a branch before a leaf 
 * This operaion does not guarantee binary tree
 * -L1 -> -B*-[L1]
 */
export function shiftLeaf<TBranch>(node: LeafNode, parent: Parent, branchData: TBranch) {
  (node as BranchNode).children = [{ data: node.data }];
  (node as BranchNode).data = branchData;
}

/** 
 * Insert a branch before a leaf, and add another leaf 
 * -L1 -> -B*-[L1,L*]
 * */
export function shiftLeafAdd<TLeaf, TBranch>(node: LeafNode<TLeaf>, parent: Parent, branchData: TBranch, newLeafData: TLeaf) {
  (node as BranchNode).children = [
    { data: node.data },
    { data: newLeafData },
  ];
  (node as BranchNode).data = branchData;
}

/** 
 * Delete a non-root node; 
 * move its children to its parent (if any children), 
 * -B*-[L1,L2] -> -[L1，L2]
 */
export function deleteNonRootBranch<TLeaf>(node: TreeNode, parent: Parent) {
  if (!parent) return;
  const indexInParent = parent.children.indexOf(node);
  if ('children' in node) {
    parent.children.splice(indexInParent, 1, ...node.children);
  }
}

/** Just delete everything, and add a leaf */
export function deleteRoot<TLeaf>(node: TreeNode, parent: Parent, defaultLeafData: TLeaf) {
  if (!parent) {
    if ('children' in node) {
      delete (node as LeafNode & { children?: TreeNode[] }).children;
    }
    node.data = defaultLeafData;
  }
}

/**
 * Delete this leaf. If parent becomes no children, make it default leaf.
 * -B-[L1, L*] -> -B-[L1]
 * -B-[L*] -> -B-[LDefault]
 */
export function deleteNonRootLeaf<TLeaf>(node: TreeNode, parent: Parent, defaultLeafData: TLeaf) {
  if (!parent) return;
  const indexInParent = parent.children.indexOf(node);
  parent.children.splice(indexInParent, 1);
  if (parent.children.length === 0) {
    delete (parent as LeafNode & { children?: TreeNode[] }).children;
    parent.data = defaultLeafData;
  }
}


export function printTree<TBranch, TLeaf,>(node: TreeNode<TBranch, TLeaf>, parent: Parent = null, depth = 0): string {
  return '\n' +
    '  '.repeat(depth) +
    (parent ? '├' : '└') +
    JSON.stringify(node.data) +
    ('children' in node ? node.children.map(x => printTree(x, node, depth + 1)).join('') : '')
    ;
}


export function traverseTree<TBranch, TLeaf, TCallbackReturnType>(
  node: TreeNode<TBranch, TLeaf>,
  callback: (data: TBranch | TLeaf, children?: TCallbackReturnType[]) => TCallbackReturnType,
): TCallbackReturnType {
  if ('children' in node) {
    const children = node.children.map(x => traverseTree(x, callback));
    return callback(node.data, children);
  } else {
    return callback(node.data);
  }
}


/** @deprecated */
export function withoutParent<TBranch, TLeaf,>(node: TreeNode<TBranch, TLeaf>): Omit<TreeNode<TBranch, TLeaf>, 'parent'> {
  const result = { data: node.data };
  if ('children' in node && node.children) {
    (result as BranchNode).children = node.children.map(withoutParent)
  }
  return result;
}

export function hasParent(nodePath: NodePath) {
  return nodePath.length > 0;
}

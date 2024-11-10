// This is an abstract tree component
// It hosts data at all nodes (different data type for branch and leaf node)
// 
// Any branch must have >= 1 leaf
// 
// Supported opertions: 
// - Add leaf to branch
// - Shift leaf: insert a branch before leaf
// - Delete a non-root node; move its children to its parent (if any children), or give its parent a new leaf (if no children)
//   which implements both
//   - Delete leaf. If parent is empty, fill an leaf
//   - Delete branch (non-root), and move its children to its parents

import { cloneDeep } from 'lodash';
import React, { ReactNode } from 'react';


export type BranchNode<T = any> = {
  data: T,
  children: TreeNode[],
  parent?: BranchNode, // only root's parent is undef
}
export type LeafNode<T = any> = {
  data: T,
  // Consider children: [] to unify both types
  parent?: BranchNode, // only root's parent is undef
}
export type TreeNode<TBranch = any, TLeaf = any> = BranchNode<TBranch> | LeafNode<TLeaf>;
export type NodePath = number[];

export interface RenderNodeProps<T> { path: any, data: T, setData: (data: T) => void }
export interface RenderBranchProps<T> extends RenderNodeProps<T> { node: BranchNode<T>, children: ReactNode[] }
export interface RenderLeafProps<T> extends RenderNodeProps<T> { node: LeafNode<T> }

export interface TreeProps<TBranch = any, TLeaf = any> {
  value: TreeNode<TBranch, TLeaf>;
  onChange: (value: TreeNode<TBranch, TLeaf>) => void;
  renderBranch: React.FC<RenderBranchProps<TBranch>>;
  renderLeaf: React.FC<RenderLeafProps<TLeaf>>;
}

export const Tree = <TBranch, TLeaf,>(props: TreeProps<TBranch, TLeaf>) => {
  // const { value, onChange, renderBranch, renderLeaf } = props;

  const RenderNode: React.FC<{ node: TreeNode<TBranch, TLeaf>, path: NodePath }> = ({ node, path }) => {

    const setData = (newData: TBranch | TLeaf) => {
      node.data = newData;
      props.onChange?.(cloneDeep(props.value));
    };

    if ('children' in node) {
      const children = node.children.map((childNode, childNodeIndex) => (
        <RenderNode node={childNode} path={[...path, childNodeIndex]} key={childNodeIndex} />)
      );
      return (
        // <Space>
        //   <div>
        //     <props.renderBranch
        //       data={node.data} path={path}
        //       setData={setData}
        //     />
        //   </div>
        //   <Space direction='vertical'> {
        //     node.children.map((childNode, childNodeIndex) => (
        //       <RenderNode node={childNode} path={[...path, childNodeIndex]} key={childNodeIndex} />)
        //     )
        //   }</Space>
        // </Space>

        <props.renderBranch data={node.data} path={path} setData={setData} children={children} node={node} />
      )
    } else {
      return (
        <props.renderLeaf
          data={node.data} path={path} node={node}
          setData={setData}
        />
      )
    }
  }
  return <RenderNode node={props.value} path={[0]} />;

}

/** Add a leaf to a branch */
export function addLeaf<TLeaf>(node: BranchNode, leafData: TLeaf) {
  node.children.push({ data: leafData, parent: node });
}

/** Insert a branch before a leaf */
export function shiftLeaf<TBranch>(node: TreeNode, branchData: TBranch) {
  console.log('shiftLeaf parent <', node.parent?.data);
  (node as BranchNode).children = [{ data: node.data, parent: (node as BranchNode) }];
  node.data = branchData;
  console.log('shiftLeaf parent >', node.parent?.data);

}

/** Delete a non-root node; 
 *  move its children to its parent (if any children), 
 *  delete ancestor recursively (if no children) 
 */
export function deleteNonRootBranch<TLeaf>(node: TreeNode) {
  console.log('deleteNode', node.parent?.children.length)
  if (!node.parent) return;
  const indexInParent = node.parent.children.indexOf(node);
  if ('children' in node) {
    console.log('deleteNode branch', node.children.length)
    node.parent.children.splice(indexInParent, 1, ...node.children);
    node.children.forEach(childNode => childNode.parent = node.parent);
  }
}

/** Just delete everything, and add a leaf */
export function deleteRoot<TLeaf>(node: TreeNode, defaultLeafData: TLeaf) {
  if (!node.parent) {
    if ('children' in node) {
      delete (node as LeafNode & { children?: TreeNode[] }).children;
    }
    node.data = defaultLeafData;
  }
}

// export function deleteNonRootLeaf<TLeaf>(node: TreeNode, defaultLeafData: TLeaf) {
//   console.log('deleteNonRootLeaf', node.parent?.children.length)
//   function deleteNodeRecursivelyIfNoChildren(node: TreeNode, defaultLeafData: TLeaf) {
//     console.log('deleteNodeIfNoChildren', 'children' in node, Boolean(node.parent))
//     if (!('children' in node && node.children.length)) {
//       if (node.parent) {
//         const indexInParent = node.parent.children.indexOf(node);
//         node.parent.children.splice(indexInParent, 1);
//         deleteNodeRecursivelyIfNoChildren(node.parent, defaultLeafData);
//       } else {
//         // found root of no children -> give it a default leaf
//         deleteRoot(node, defaultLeafData);
//       }
//     }
//   }
//   deleteNodeRecursivelyIfNoChildren(node, defaultLeafData);
// }

// Delete this leaf. If parent becomes no children, make it default leaf.
export function deleteNonRootLeaf<TLeaf>(node: TreeNode, defaultLeafData: TLeaf) {
  if (!node.parent) return;
  const indexInParent = node.parent.children.indexOf(node);
  node.parent.children.splice(indexInParent, 1);
  if (node.parent.children.length === 0) {
    delete (node.parent as LeafNode & { children?: TreeNode[] }).children;
    node.parent.data = defaultLeafData;
  }
}


/** Get operations bound with */
export function getOperationsFor<TBranch, TLeaf,>(state: TreeNode<TBranch, TLeaf>, setState: (newState: TreeNode<TBranch, TLeaf>) => void) {
  // const bindWithSetState = <F extends (...args: any[]) => void>(func: F): F => (
  //   (...args: Parameters<F>) => {
  //     func(...args);
  //     setState(cloneDeep(state));
  //   }
  // ) as F;
  return {
    addLeaf: (node: BranchNode, leafData: TLeaf) => { addLeaf(node, leafData); setState(cloneDeep(state)); },
    shiftLeaf: (node: TreeNode, branchData: TBranch) => { shiftLeaf(node, branchData); setState(cloneDeep(state)); },
    deleteNonRootBranch: (node: TreeNode) => { deleteNonRootBranch(node); setState(cloneDeep(state)); },
    deleteNonRootLeaf: (node: TreeNode, defaultLeafData: TLeaf) => { deleteNonRootLeaf(node, defaultLeafData); setState(cloneDeep(state)); },
    deleteRoot: (node: TreeNode, defaultLeafData: TLeaf) => { deleteRoot(node, defaultLeafData); setState(cloneDeep(state)); },
  }
}

export const setTreeData = <TBranch, TLeaf,>(dataValue: TBranch | TLeaf, path: NodePath, treeValue: TreeNode<TBranch, TLeaf>) => {

}

export function printTree<TBranch, TLeaf,>(node: TreeNode<TBranch, TLeaf>, depth=0): string {
  return '\n' + '  '.repeat(depth) + JSON.stringify(node.data) + (
    'children' in node ? node.children.map(x => printTree(x, depth + 1)).join('') : ''
  );
}

export function withoutParent<TBranch, TLeaf,>(node: TreeNode<TBranch, TLeaf>) {
  const result = { data: node.data };
  if ('children' in node && node.children) {
    // @ts-ignore
    result.children = node.children.map(withoutParent)
  }
  return result;
}

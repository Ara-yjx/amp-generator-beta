// This is an abstract tree component. 
// It provides a framework to help rendering the tree, and binds necessary operation, so that caller can focus on the rendering the nodes.
// It hosts data at all nodes (different data type for branch and leaf node)

import React, { ReactNode } from 'react';
import { ArcoFormItem } from '../util/arco';
import { BranchNode, LeafNode, TreeNode, NodePath, Parent, addLeaf, shiftLeaf, shiftLeafAdd, deleteNonRootBranch, deleteRoot, deleteNonRootLeaf } from '../data/tree';



export interface RenderNodeProps<T> { path: any, data: T, setData: (data: T) => void }
// Cannot use node as props, because props cannot be circular
export interface RenderBranchProps<TBranch, TLeaf> extends RenderNodeProps<TBranch> {
  children: ReactNode[],
  operations: {
    addLeaf: (leafData: TLeaf) => void,
    deleteNonRootBranch: () => void,
    deleteRoot: (defaultLeafData: TLeaf) => void;
  }
}
export interface RenderLeafProps<TLeaf> extends RenderNodeProps<TLeaf> {
  operations: {
    shiftLeaf: (branchData: any) => void;
    shiftLeafAdd: (branchData: any, newLeafData: any) => void;
    deleteNonRootLeaf: (defaultLeafData: TLeaf) => void;
    deleteRoot: (defaultLeafData: TLeaf) => void;
  }
}

export interface TreeProps<TBranch = any, TLeaf = any> extends ArcoFormItem<TreeNode<TBranch, TLeaf>> {
  renderBranch: React.FC<RenderBranchProps<TBranch, TLeaf>>;
  renderLeaf: React.FC<RenderLeafProps<TLeaf>>;
}

export const Tree = <TBranch, TLeaf,>(props: TreeProps<TBranch, TLeaf>) => {

  if (props.value === undefined) {
    return null;
  }

  // RenderNode is not a real React component because node cannot be a props
  const RenderNode = ({ node, parent, path }: {
    node: TreeNode<TBranch, TLeaf>,
    parent: BranchNode | null,
    path: NodePath
  }) => {

    const setData = (newData: TBranch | TLeaf) => {
      node.data = newData;
      props.onChange?.(props.value);
    };

    if ('children' in node) {
      const children = node.children.map((childNode, childNodeIndex) => (
        RenderNode({ node: childNode, parent: node, path: [...path, childNodeIndex] })
      ));
      return (
        <props.renderBranch
          data={node.data} path={path} setData={setData} children={children}
          operations={{
            addLeaf: (...args) => { addLeaf(node, parent, ...args); props.onChange?.(props.value) },
            deleteNonRootBranch: (...args) => { deleteNonRootBranch(node, parent, ...args); props.onChange?.(props.value) },
            deleteRoot: (...args) => { deleteRoot(node, parent, ...args); props.onChange?.(props.value) },
          }}
          key={JSON.stringify(path)}
        />
      )
    } else {
      return (
        <props.renderLeaf
          data={node.data} setData={setData} path={path}
          operations={{
            shiftLeaf: (...args) => { shiftLeaf(node, parent, ...args); props.onChange?.(props.value) },
            shiftLeafAdd: (...args) => { shiftLeafAdd(node, parent, ...args); props.onChange?.(props.value) },
            deleteNonRootLeaf: (...args) => { deleteNonRootLeaf(node, parent, ...args); props.onChange?.(props.value) },
            deleteRoot: (...args) => { deleteRoot(node, parent, ...args); props.onChange?.(props.value) },
          }}
          key={JSON.stringify(path)}
        />
      )
    }
  }

  return <RenderNode node={props.value!} parent={null} path={[]} />;
}

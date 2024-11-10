import { Button, Form, Select, Space, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconArrowLeft, IconBranch, IconDelete, IconMinus, IconPlus } from '@arco-design/web-react/icon';
import { range } from 'lodash';
import React, { useEffect } from 'react';
import type { AmpStimuli, AT, BranchData, LeafData } from '../data/ampTypes';
import { flatMap2d, forEach2d, getDisplayKey } from '../util/util';
import { getOperationsFor, RenderBranchProps, RenderLeafProps, Tree, TreeNode, withoutParent } from './tree';


const { Item, List } = Form;


const ResponseCondition: React.FC<{ data: AT.ResponseCondition, refresh: () => void, pageIndex: number }> = ({ data, refresh, pageIndex }) => {
  const { form } = useFormContext();
  // console.log('conditionWatch', conditionWatch)
  const conditionPageOptions = range(pageIndex).map((_, index) => ({
    label: `Page #${index + 1}`, value: index,
  }));
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[] | undefined;
  const selectedPageWatch = pagesWatch?.[data[1]];
  const selectedPageResponseWatch = selectedPageWatch?.response;
  // const selectedPageResponseWatch = useWatch(`advancedTimeline.pages[${conditionWatch[1]}].response`, form) as AT.Page['response'] | undefined;
  // console.log('selectedPageResponseWatch', `advancedTimeline.pages[${conditionWatch[1]}].response`, selectedPageResponseWatch)
  const conditionResponseOptions = [];
  if (selectedPageResponseWatch?.timeout.enabled) {
    conditionResponseOptions.push({ label: `Fixed duration`, value: '_AP' }) // todo : rename to "TIMEOUT"
  }
  if (selectedPageResponseWatch?.keyboard.enabled) {
    selectedPageResponseWatch?.keyboard.keys.map(key =>
      conditionResponseOptions.push({ label: `Keyboard ${key}`, value: key })
    );
  }
  if (selectedPageResponseWatch?.mouseClick.enabled) {
    selectedPageWatch && forEach2d(selectedPageWatch.layoutedDisplays, (displayItem, row, col) => {
      if (displayItem.mouseClick) {
        conditionResponseOptions.push({ label: `Click ${getDisplayKey(row, col)}`, value: `_MOUSE.${row}.${col}` }) // todo : rename to "mouseClick" + key
      }
    })
  }

  useEffect(() => {
    if (data[1] >= pageIndex) {
      data[1] = 0;
      refresh();
    }
  });
  // useOptionGuards(`${field}.condition[1]`, conditionPageOptions);
  // useOptionGuards(`${field}.condition[3]`, conditionResponseOptions, { multiple: true });

  return (
    <Space style={{ fontSize: 14 }} >
      <Select
        options={conditionPageOptions} style={{ width: 100 }}
        value={data[1]} onChange={(v) => { data[1] = v; refresh() }}
      />
      <Select
        options={[{ label: 'is', value: '==' }, { label: 'is not', value: '!=' }]} style={{ width: 100 }}
        value={data[2]} onChange={(v) => { data[2] = v; refresh() }}
      />
      <Select
        mode='multiple'
        options={conditionResponseOptions}
        style={{ width: 200 }}
        notFoundContent={
          <Typography.Text disabled>
            The selected page needs to have at least one type of response.
          </Typography.Text>
        }
        value={data[3]} onChange={(v) => { data[3] = v; refresh() }}
      />
      {/* <Item field={`${field}.condition[1]`} noStyle>
        <Select options={conditionPageOptions} style={{ width: 100 }} />
      </Item>
      <Item field={`${field}.condition[2]`} noStyle>
        <Select options={[{ label: 'is', value: '==' }, { label: 'is not', value: '!=' }]} style={{ width: 100 }} />
      </Item>
      <Item field={`${field}.condition[3]`} noStyle>
        <Select
          mode='multiple'
          options={conditionResponseOptions}
          style={{ width: 200 }}
          notFoundContent={
            <Typography.Text disabled>
              The selected page needs to have at least one type of response.
            </Typography.Text>
          }
        />
      </Item> */}
    </Space>

  );

}


const PoolSelectionCondition: React.FC<{ data: AT.PoolSelectionCondition, refresh: () => void, pageIndex: number }> = ({ data, refresh, pageIndex }) => {
  const { form } = useFormContext();

  const pageOptions = range(pageIndex).map((_, index) => ({
    label: `Page #${index + 1}`, value: index,
  }));
  const conditionPageIndex = data[1];
  const selectedPageWatch = useWatch(`advancedTimeline.pages[${conditionPageIndex}]`, form) as AT.Page | undefined;
  const poolsWatch = useWatch(`stimuli`, form) as AmpStimuli[] | undefined;

  const keyOptions = flatMap2d(selectedPageWatch?.layoutedDisplays ?? [], (item, row, col) => ({
    label: `Display ${getDisplayKey(row, col)}`,
    value: getDisplayKey(row, col),
  }));

  const poolOptions = range(poolsWatch?.length ?? 0).map(poolIndex => ({
    label: `Pool ${poolIndex + 1}`,
    value: poolIndex,
  }));

  return (
    <Space>
      <Select
        options={pageOptions} style={{ width: 100 }}
        value={data[1]} onChange={(v) => { data[1] = v; refresh() }}
      />
      <Select
        options={keyOptions} style={{ width: 120 }}
        value={data[2]} onChange={(v) => { data[2] = v; refresh() }}
      />
      <Select
        options={[{ label: 'is', value: '==' }, { label: 'is not', value: '!=' }]} style={{ width: 100 }}
        value={data[3]} onChange={(v) => { data[3] = v; refresh() }}
      />
      <Select
        options={poolOptions} style={{ width: 100 }} mode='multiple'
        value={data[4]} onChange={(v) => { data[4] = v; refresh() }}
      />
    </Space>
    // <Item field={field} noStyle>
    //   <Input />
    // </Item>
  )
}

export const AdvancedTimelineCondition: React.FC<{ field: string, pageIndex: number }> = ({ field, pageIndex }) => {
  const { form } = useFormContext();

  const tree = form.getFieldValue(field);
  const setTreeAndForm = (treeData: TreeNode<BranchData, LeafData>) => {
    form.setFieldValue(field, withoutParent(treeData));
  };
  const { addLeaf, shiftLeaf, deleteNonRootBranch, deleteNonRootLeaf, deleteRoot } = getOperationsFor(tree, setTreeAndForm);


  // const RenderBranch: React.FC<RenderBranchProps<string>> = ({ path, data, node, setData, children }) => (
  //   <Space direction='vertical'>
  //     <Space>
  //       Branch <Input value={data} onChange={setData} /> @ {JSON.stringify(path)} ^ {node.parent?.data}
  //       <Button onClick={() => addLeaf(node, 1000)} >addLeaf</Button>
  //       <Button onClick={() => deleteNode(node, -1)} >deleteNode</Button>
  //     </Space>
  //     {children.map((child, childIndex) => <div style={{ marginLeft: 40 }} key={path + childIndex}>{child}</div>)}
  //   </Space>
  // );

  // const RenderLeaf: React.FC<RenderLeafProps<number>> = ({ path, data, node, setData }) => (
  //   <Space>
  //     Leaf {JSON.stringify(data)} @ {JSON.stringify(path)} ^ {node.parent?.data}
  //     <Button onClick={() => setData(data + 1)} >+1</Button>
  //     <Button onClick={() => shiftLeaf(node, 'SHIFT')} >shiftLeaf</Button>
  //     <Button onClick={() => deleteNode(node, -1)} >deleteNode</Button>
  //   </Space>
  // );


  const RenderBranch: React.FC<RenderBranchProps<BranchData>> = ({ path, data, node, setData, children }) => (
    <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid lightgrey', padding: 2 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Select
          // size='small'
          options={[{ label: 'AND', value: 'and' }, { label: 'OR', value: 'or' }]}
          value={data} onChange={setData}
          style={{ width: 80 }} bordered={false}
        />
        {
          (node.parent !== undefined) ? (
            <Button shape='round' size='mini' type='outline' onClick={() => deleteNonRootBranch(node)} ><span><IconArrowLeft /><IconDelete /></span></Button>
          ) : (
            <Button shape='round' size='mini' type='outline' onClick={() => deleteRoot(node, [undefined])} ><IconDelete /></Button>
          )
        }
      </div>
      {/* <Divider type='vertical' /> */}
      <Space direction='vertical' style={{ paddingLeft: 0 }}>
        {
          [...children, <Button icon={<IconPlus />} shape='round' size='mini' type='outline' onClick={() => addLeaf(node, [undefined])} />].map((comp, compIndex) => (
            <Space key={path + compIndex} align='baseline'><IconMinus />{comp}</Space>
          ))
        }
      </Space>
    </div>
  );

  const RenderLeaf: React.FC<RenderLeafProps<LeafData>> = ({ path, data, node, setData }) => {
    const [type, ...detail] = node.data;
    return (
      <Space>
        {/* Leaf {JSON.stringify(data)} @ {JSON.stringify(path)} ^ {node.parent?.data} */}
        <Select
          style={{ width: 180 }}
          value={type}
          onChange={newType => setData(getDefaultCondition(newType))}
          options={[{ label: 'The response of', value: 'response' }, { label: 'The selected pool of', value: 'poolSelection' }]}
        />

        {type === 'response' && <ResponseCondition data={(data as AT.ResponseCondition)} refresh={() => setData(data)} pageIndex={pageIndex} />}
        {type === 'poolSelection' && <PoolSelectionCondition data={(data as AT.PoolSelectionCondition)} refresh={() => setData(data)} pageIndex={pageIndex} />}

        <Button shape='round' size='mini' type='outline' onClick={() => shiftLeaf(node, 'and')} icon={<IconPlus />}>AND</Button>
        <Button shape='round' size='mini' type='outline' onClick={() => shiftLeaf(node, 'or')} icon={<IconPlus />}>OR</Button>
        {
          node.parent !== undefined && (
            <Button icon={<IconDelete />} shape='circle' size='mini' type='outline' onClick={() => deleteNonRootLeaf(node, [undefined])} />
          )
        }
      </Space>
    )
  };

  return (
    <Space style={{ fontSize: 14 }} direction='vertical'>
      {/* <Select
          options={[
            { label: '✓ Always display this page.', value: 0 },
            { label: 'Display this page conditionally:', value: 1 }
          ]}
          size='small'
          style={{ width: 280 }}
          value={conditionValue}
          onChange={onConditionChange}
          disabled={pageIndex === 0}
        /> */}


      <Space>
        <IconBranch />
        Display this page only if
      </Space>
      {/* <Space>
        The response of
        <ResponseCondition field={field} pageIndex={pageIndex} />
      </Space> */}

      <Tree
        value={tree}
        onChange={newValue => { setTreeAndForm(newValue) }}
        renderBranch={RenderBranch}
        renderLeaf={RenderLeaf}
      />

      {/* {JSON.stringify(tree)} */}
    </Space>
  )
}

// function transformConditionTree(node: TreeNode<BranchData, LeafData>): AT.Condition {
//   if ('children' in node) {
//     return [node.data, ...node.children.map(transformConditionTree)]
//   } else if (node.data[0] !== undefined) {
//     return node.data;
//   } else {

//   }
// }

function getDefaultCondition(newType: 'response' | 'poolSelection' | undefined): LeafData {
  if (newType === 'response') return [newType, 0, '==', []];
  if (newType === 'poolSelection') return [newType, 0, 'A1', '==', []];
  return [newType];
}
import { Button, Form, Select, Space, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconArrowLeft, IconBranch, IconDelete, IconMinus, IconPlus } from '@arco-design/web-react/icon';
import { range } from 'lodash';
import React, { useEffect } from 'react';
import type { AmpStimuli, AT, BranchData, LeafData } from '../data/ampTypes';
import { flatMap2d, forEach2d, getDisplayKey } from '../util/util';
import { RenderBranchProps, RenderLeafProps, Tree } from './tree';
import { hasParent } from '../data/tree';


const { Item, List } = Form;


const ResponseCondition: React.FC<{ data: AT.ResponseCondition, refresh: () => void, pageIndex: number }> = ({ data, refresh, pageIndex }) => {
  const { form } = useFormContext();
  const conditionPageOptions = range(pageIndex).map((_, index) => ({
    label: `Page #${index + 1}`, value: index,
  }));
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[] | undefined;
  const selectedPageWatch = pagesWatch?.[data[1]];
  const selectedPageResponseWatch = selectedPageWatch?.response;
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
  )
}

export const AdvancedTimelineCondition: React.FC<{ field: string, pageIndex: number }> = ({ field, pageIndex }) => {

  const RenderBranch: React.FC<RenderBranchProps<BranchData, LeafData>> = ({ path, data, setData, children, operations: { addLeaf, deleteNonRootBranch, deleteRoot } }) => (
    <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid lightgrey', padding: 2 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Select
          // size='small'
          options={[{ label: 'AND', value: 'and' }, { label: 'OR', value: 'or' }]}
          value={data} onChange={setData}
          style={{ width: 80 }} bordered={false}
        />
        {
          hasParent(path) ? (
            <Button shape='round' size='mini' type='outline' onClick={() => deleteNonRootBranch()} ><span><IconArrowLeft /><IconDelete /></span></Button>
          ) : (
            <Button shape='round' size='mini' type='outline' onClick={() => deleteRoot([undefined])} ><IconDelete /></Button>
          )
        }
      </div>
      {/* <Divider type='vertical' /> */}
      <Space direction='vertical' style={{ paddingLeft: 0 }}>
        {
          [...children, <Button icon={<IconPlus />} shape='round' size='mini' type='outline' onClick={() => addLeaf([undefined])} />].map((comp, compIndex) => (
            <Space key={path + compIndex} align='baseline'>
              <IconMinus />
              {comp}
            </Space>
          ))
        }
      </Space>
    </div>
  );

  const RenderLeaf: React.FC<RenderLeafProps<LeafData>> = ({ path, data, setData, operations: { shiftLeafAdd, deleteNonRootLeaf } }) => {
    const [type] = data;
    return (
      <Space>
        <Select
          style={{ width: 180 }}
          value={type}
          onChange={newType => setData(getDefaultCondition(newType))}
          options={[{ label: 'The response of', value: 'response' }, { label: 'The selected pool of', value: 'poolSelection' }]}
        />

        {type === 'response' && <ResponseCondition data={(data as AT.ResponseCondition)} refresh={() => setData(data)} pageIndex={pageIndex} />}
        {type === 'poolSelection' && <PoolSelectionCondition data={(data as AT.PoolSelectionCondition)} refresh={() => setData(data)} pageIndex={pageIndex} />}

        <Button shape='round' size='mini' type='outline' onClick={() => shiftLeafAdd('and', [undefined])} icon={<IconPlus />}>AND</Button>
        <Button shape='round' size='mini' type='outline' onClick={() => shiftLeafAdd('or', [undefined])} icon={<IconPlus />}>OR</Button>
        {
          hasParent(path) && (
            <Button icon={<IconDelete />} shape='circle' size='mini' type='outline' onClick={() => deleteNonRootLeaf([undefined])} />
          )
        }
      </Space>
    )
  };

  return (
    <Space style={{ fontSize: 14 }} direction='vertical'>
      <Space>
        <IconBranch />
        Display this page only if
      </Space>
      {/* <Space>
        The response of
        <ResponseCondition field={field} pageIndex={pageIndex} />
      </Space> */}

      <Item field={field} noStyle>
        <Tree
          renderBranch={RenderBranch}
          renderLeaf={RenderLeaf}
        />
      </Item>
      {/* <pre>{printTree(tree)}</pre> */}
    </Space>
  )
}

function getDefaultCondition(newType: 'response' | 'poolSelection' | undefined): LeafData {
  if (newType === 'response') return [newType, 0, '==', []];
  if (newType === 'poolSelection') return [newType, 0, 'A1', '==', []];
  return [newType];
}

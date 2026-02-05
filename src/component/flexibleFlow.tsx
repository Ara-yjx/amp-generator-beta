import { Button, Card, Form, Input, Select, Space, Typography } from '@arco-design/web-react';
import { IconArrowDown, IconArrowFall, IconArrowRight, IconArrowUp, IconBranch, IconDelete, IconFile, IconLeft, IconPlus, IconRefresh, IconSave, IconStop } from '@arco-design/web-react/icon';
import React from 'react';
import { AT } from '../data/ampTypes';
import { AdvancedTimelineCondition } from './advancedTimelineCondition';

const { Item, List, useFormContext, useWatch } = Form;

type Flow = AT.FlexibleFlow.Flow;
type FlowNode = AT.FlexibleFlow.FlowNode;
type ConditionFlowNode = AT.FlexibleFlow.ConditionFlowNode;
type PageFlowNode = AT.FlexibleFlow.PageFlowNode;
type RandomizerFlowNode = AT.FlexibleFlow.RandomizerFlowNode;

const FLOW_COLORS = {
  page: {
    text: '#1D2129', // Arco gray-10
    border: '#a9aeb8', // Arco gray-5
    background: '#F5F6FA', // Arco gray-1
  },
  condition: {
    text: '#114BA3', // Arco blue-8
    border: '#9FD4FD', // Arco blue-3
    background: '#E8F7FF', // Arco blue-1
  },
  randomizer: {
    text: '#7816C1', // Arco purple-8
    border: '#D4B5FB', // Arco purple-3
    background: '#F5ECFF', // Arco purple-1
  },
  end: {
    text: '#A1151E', // Arco red-8
    border: '#FBACA3', // Arco red-3
    background: '#FFECE8', // Arco red-1
  },
};

const CARD_WIDTH = '75em';
const INDENT = 80;

// Context to manage which FlowEditor is expanded
const ExpandedFlowContext = React.createContext<{
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}>({
  expandedId: null,
  setExpandedId: () => {},
});

const emptyConditionNode = (): ConditionFlowNode => ({
  type: 'condition',
  condition: { data: [undefined] } as AT.ConditionTree, // empty condition tree leaf
  branches: [
    { value: true, flow: [] },
    { value: false, flow: [] },
  ],
});

const emptyPageNode = (): PageFlowNode => ({
  type: 'page',
  pageIndex: 0,
});

const emptyEndNode = (): AT.FlexibleFlow.EndFlowNode => ({
  type: 'end',
});

const emptyRandomizerNode = (): RandomizerFlowNode => ({
  type: 'randomizer',
  branchCount: 2,
  branches: [
    { flow: [] },
    { flow: [] },
  ],
});


/**
 * Recursively renders a Flow (array of FlowNodes)
 */
const FlowEditor: React.FC<{ field: string, depth?: number }> = ({ field, depth = 0 }) => {
  const editorId = React.useId();
  const { expandedId, setExpandedId } = React.useContext(ExpandedFlowContext);
  const isExpanded = expandedId === editorId;

  const handleToggle = () => {
    setExpandedId(isExpanded ? null : editorId);
  };

  return (
    <List field={field}>
      {(fields, { add, remove, move }) => (
        <div style={{
          // Hide this indentation line for now. Use container's padding instead.
          // paddingLeft: depth > 0 ? 24 : 0,
          // marginLeft: depth > 0 ? 8 : 0,
          // borderLeft: depth > 0 ? '2px solid #e8e8e8' : 'none',
        }}>
          {fields.map((item, index) => (
            <FlowNodeEditor
              field={item.field}
              index={index}
              depth={depth}
              onRemove={() => remove(index)}
              onMoveUp={index > 0 ? () => move(index, index - 1) : undefined}
              onMoveDown={index < fields.length - 1 ? () => move(index, index + 1) : undefined}
            />
          ))}

          <Space style={{ marginTop: 8 }}>
            <Button
              type='outline'
              shape='round'
              size='small'
              icon={isExpanded ? <IconLeft /> : <IconPlus />}
              onClick={handleToggle}
            />
            {isExpanded && (
              <>
                <Button
                  type='outline'
                  shape='round'
                  size='small'
                  icon={<><IconPlus></IconPlus><IconBranch /></>}
                  onClick={() => add(emptyConditionNode())}
                >
                  Condition
                </Button>
                <Button
                  type='outline'
                  shape='round'
                  size='small'
                  icon={<><IconPlus></IconPlus><IconRefresh /></>}
                  onClick={() => add(emptyRandomizerNode())}
                >
                  Randomizer
                </Button>
                <Button
                  type='outline'
                  shape='round'
                  size='small'
                  icon={<><IconPlus></IconPlus><IconFile /></>}
                  onClick={() => add(emptyPageNode())}
                >
                  Page
                </Button>
                <Button
                  type='outline'
                  shape='round'
                  size='small'
                  icon={<><IconPlus></IconPlus><IconStop /></>}
                  onClick={() => add(emptyEndNode())}
                >
                  End
                </Button>
              </>
            )}
          </Space>
        </div>
      )}
    </List>
  );
};


/**
 * Renders a single FlowNode based on its type
 */
const FlowNodeEditor: React.FC<{
  field: string,
  index: number,
  depth: number,
  onRemove: () => void,
  onMoveUp?: () => void,
  onMoveDown?: () => void
}> = ({ field, index, depth, onRemove, onMoveUp, onMoveDown }) => {
  const { form } = useFormContext();
  const nodeWatch = useWatch(field, form) as FlowNode | undefined;

  if (!nodeWatch) return null;

  const cardBody = (() => {
    if (nodeWatch.type === 'condition') return <ConditionFlowNodeCard field={field} />;
    if (nodeWatch.type === 'randomizer') return <RandomizerFlowNodeCard field={field} />;
    if (nodeWatch.type === 'page') return <PageFlowNodeEditor field={field} />;
    return <Typography.Text type='secondary'>End this trial immediately.</Typography.Text>;
  })();

  const childBranches = (() => {
    if (nodeWatch.type === 'condition') return <ConditionFlowNodeBranches field={field} depth={depth} />;
    if (nodeWatch.type === 'randomizer') return <RandomizerFlowNodeBranches field={field} depth={depth} />;
    return null;
  })();

  return (
    <div style={{ marginBottom: 12 }}>
      <Card
        style={{
          borderColor: FLOW_COLORS[nodeWatch.type].border,
          backgroundColor: FLOW_COLORS[nodeWatch.type].background,
          width: CARD_WIDTH,
        }}
        size='small'
        title={
          <Space style={{ color: FLOW_COLORS[nodeWatch.type].text }}>
            {nodeWatch.type === 'page' && <span ><IconFile /> Page Display</span >}
            {nodeWatch.type === 'condition' && <span ><IconBranch /> Condition</span >}
            {nodeWatch.type === 'randomizer' && <span ><IconRefresh /> Randomizer</span >}
            {nodeWatch.type === 'end' && <span ><IconStop /> End</span >}
          </Space>
        }
        extra={
          <Space size='small'>
            {onMoveUp && (
              <Button
                icon={<IconArrowUp />}
                shape='circle'
                size='small'
                onClick={onMoveUp}
                title='Move up'
              />
            )}
            {onMoveDown && (
              <Button
                icon={<IconArrowDown />}
                shape='circle'
                size='small'
                onClick={onMoveDown}
                title='Move down'
              />
            )}
            <Button
              icon={<IconDelete />}
              shape='circle'
              size='small'
              status='danger'
              onClick={onRemove}
              title='Delete'
            />
          </Space>
        }
      >
        {cardBody}
      </Card>
      {childBranches && (
        <div style={{ marginTop: 12 }}>
          {childBranches}
        </div>
      )}
    </div>
  );
};


/**
 * Card body for a ConditionFlowNode
 */
const ConditionFlowNodeCard: React.FC<{ field: string }> = ({ field }) => {
  return (
    <div style={{ padding: '8px' }}>
      <AdvancedTimelineCondition field={`${field}.condition`} pageIndex={null} noLabel />
    </div>
  );
};

/**
 * Branch sections for a ConditionFlowNode (rendered outside the card)
 */
const ConditionFlowNodeBranches: React.FC<{ field: string, depth: number }> = ({ field, depth }) => {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', color: FLOW_COLORS.condition.text, marginBottom: 4 }}>
          <IconArrowRight style={{ marginRight: 4 }} />
          <Typography.Text bold style={{ color: FLOW_COLORS.condition.text }}>If condition is True:</Typography.Text>
        </div>
        <div style={{ paddingLeft: INDENT }}>
          <FlowEditor field={`${field}.branches[0].flow`} depth={depth + 1} />
        </div>
      </div>


      <div>
        <div style={{ display: 'flex', alignItems: 'center', color: FLOW_COLORS.condition.text, marginBottom: 4 }}>
          <IconArrowRight style={{ marginRight: 4 }} />
          <Typography.Text bold style={{ color: FLOW_COLORS.condition.text }}>If condition is False:</Typography.Text>
        </div>
        <div style={{ paddingLeft: INDENT }}>
          <FlowEditor field={`${field}.branches[1].flow`} depth={depth + 1} />
        </div>
      </div>
    </div>
  );
};


/**
 * Card body for a RandomizerFlowNode
 */
const RandomizerFlowNodeCard: React.FC<{ field: string }> = ({ field }) => {
  const { form } = useFormContext();
  const nodeWatch = useWatch(field, form) as RandomizerFlowNode | undefined;
  const branchCount = nodeWatch?.branchCount ?? 2;

  const handleBranchCountChange = (newCount: number) => {
    if (newCount < 1) return;
    const currentBranches = form.getFieldValue(`${field}.branches`) || [];
    const newBranches = Array.from({ length: newCount }, (_, i) => currentBranches[i] || { flow: [] });
    form.setFieldValue(`${field}.branches`, newBranches);
    form.setFieldValue(`${field}.branchCount`, newCount);
  };

  return (
    <div>
      <Space>
        <Typography.Text>Randomly select from</Typography.Text>
        <Item field={`${field}.branchCount`} noStyle>
          <Input
            type='number'
            min={1}
            max={10}
            style={{ width: 60 }}
            onChange={(value) => handleBranchCountChange(Number(value))}
          />
        </Item>
        <Typography.Text>branches</Typography.Text>
      </Space>
    </div>
  );
};

/**
 * Branch sections for a RandomizerFlowNode (rendered outside the card)
 */
const RandomizerFlowNodeBranches: React.FC<{ field: string, depth: number }> = ({ field, depth }) => {
  const { form } = useFormContext();
  const nodeWatch = useWatch(field, form) as RandomizerFlowNode | undefined;
  const branchCount = nodeWatch?.branchCount ?? nodeWatch?.branches?.length ?? 0;

  return (
    <div>
      {Array.from({ length: branchCount }, (_, i) => (
        <React.Fragment key={i}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: FLOW_COLORS.randomizer.text, marginBottom: 4 }}>
              <IconArrowRight style={{ marginRight: 4 }} />
              <Typography.Text bold style={{ color: FLOW_COLORS.randomizer.text }}>Branch {i + 1}:</Typography.Text>
            </div>
            <div style={{ paddingLeft: INDENT }}>
              <FlowEditor field={`${field}.branches[${i}].flow`} depth={depth + 1} />
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};


/**
 * Editor for a PageFlowNode
 */
const PageFlowNodeEditor: React.FC<{ field: string }> = ({ field }) => {
  const { form } = useFormContext();
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[] | undefined;
  const flowWatch = useWatch('advancedTimeline.flow', form) as Flow | undefined;
  const currentPageIndex = useWatch(`${field}.pageIndex`, form) as number | undefined;

  const pageOptions = (pagesWatch ?? []).map((page, index) => ({
    label: `Page #${index + 1}${page.name ? ` (${page.name})` : ''}`,
    value: index,
  }));

  // Check if this page is used multiple times in the flow
  const isPageUsedTwice = React.useMemo(() => {
    if (!flowWatch || currentPageIndex === undefined) return 0;
    const usedPages: number[] = [];
    iterateFlexibleFlow(flowWatch, (node) => {
      if (node.type === 'page') {
        usedPages.push(node.pageIndex);
      }
    });
    const pageUsageCount = usedPages.filter(p => p === currentPageIndex).length;
    return pageUsageCount > 1;
  }, [flowWatch, currentPageIndex]);

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Space>
        <Item field={`${field}.pageIndex`} noStyle>
          <Select
            options={pageOptions}
            style={{ width: 300 }}
            placeholder='Select a page'
          />
        </Item>
        {isPageUsedTwice && (
          <Typography.Text type='warning' style={{ fontSize: 12 }}>
            Please make sure that each page is displayed AT MOST ONCE in the actual trial flow.
          </Typography.Text>
        )}
      </Space>
    </Space>
  );
};


export const FlexibleFlow: React.FC<{ onCloseEditor?: () => void }> = ({ onCloseEditor }) => {
  const { form } = useFormContext();
  const flowWatch = useWatch('advancedTimeline.flow', form) as Flow | undefined;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <ExpandedFlowContext.Provider value={{ expandedId, setExpandedId }}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography.Title heading={4} style={{ margin: 0 }}>Flexible Flow Editor</Typography.Title>
          <Button icon={<IconSave />} type='primary' onClick={() => onCloseEditor?.()}>
            Save & Close
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <FlowEditor field="advancedTimeline.flow" />
        </div>

        {/* Debug view */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: 16 }}>
            <summary>Debug: Flow Data</summary>
            <pre style={{ fontSize: 10, maxHeight: 200, overflow: 'auto' }}>
              {JSON.stringify(flowWatch, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </ExpandedFlowContext.Provider>
  );
};

/**
 * Recursively iterate through all nodes in a flexible flow
 */
function iterateFlexibleFlow(flow: Flow | undefined, cb: (node: FlowNode) => void): void {
  if (!flow) return;
  for (const node of flow) {
    cb(node);
    if (node.type === 'condition') {
      for (const branch of node.branches) {
        iterateFlexibleFlow(branch.flow, cb);
      }
    } else if (node.type === 'randomizer') {
      for (const branch of node.branches) {
        iterateFlexibleFlow(branch.flow, cb);
      }
    }
  }
}

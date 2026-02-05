import { Button, Form, Message, Modal, Space, Switch, Typography } from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import React, { useCallback } from 'react';
import { FlexibleFlow } from './flexibleFlow';
import { AT } from '../data/ampTypes';

const { useFormContext, useWatch } = Form;
const { Text } = Typography;

export const FlexibleFlowModal: React.FC = () => {
  const [isModelVisible, setIsModelVisible] = React.useState(false);
  const onCloseEditor = useCallback(() => {
    setIsModelVisible(false);
  }, []);

  const flowWatch = useWatch('advancedTimeline.flow');

  const { form } = useFormContext();
  const onCheckboxChange = (value: boolean) => {
    if (value) {
      form.setFieldValue('advancedTimeline', transformAdvancedTimelineToFlexibleFlow(form.getFieldValue('advancedTimeline')));
    } else {
      form.setFieldValue('advancedTimeline.flow', undefined);
    }
  }

  return (
    <Space style={{ marginTop: 10, marginBottom: 10 }}>
      <Switch checked={!!flowWatch} onChange={onCheckboxChange} />
      <Text>Enable Flexible Flow</Text>
      <Button type='outline' icon={<IconEdit />} disabled={!flowWatch} onClick={() => setIsModelVisible(true)}>
        Edit Flexible Flow
      </Button>
      {
        isModelVisible && (
          <Modal
            simple
            alignCenter
            style={{ width: '100%', minHeight: '100vh', padding: 0 }}
            title={null}
            footer={null}
            visible={isModelVisible}
            autoFocus={false}
            focusLock={true}
          >
            <FlexibleFlow onCloseEditor={onCloseEditor} />
          </Modal>
        )
      }
    </Space>
  );
};

/**
 * Transform an AdvancedTimeline (with page-level conditions) to use FlexibleFlow.
 * - For each page without condition: create a Page FlowNode
 * - For each page with condition: create a Condition FlowNode with the page in the true branch
 * - Clears individual page conditions since they're now in the flow
 */
function transformAdvancedTimelineToFlexibleFlow(advancedTimeline: AT.AdvancedTimeline): AT.AdvancedTimeline {
  const flow: AT.FlexibleFlow.Flow = [];
  let hasAnyCondition = false;

  advancedTimeline.pages.forEach((page, pageIndex) => {
    const pageNode: AT.FlexibleFlow.PageFlowNode = {
      type: 'page',
      pageIndex,
    };

    if (page.condition && !isEmptyCondition(page.condition)) {
      // Page has a condition - wrap it in a Condition FlowNode
      const conditionNode: AT.FlexibleFlow.ConditionFlowNode = {
        type: 'condition',
        condition: page.condition,
        branches: [
          { value: true, flow: [pageNode] },
          { value: false, flow: [] },
        ],
      };
      flow.push(conditionNode);
      hasAnyCondition = true;
    } else {
      // Page has no condition - just add as Page FlowNode
      flow.push(pageNode);
    }
  });

  if (hasAnyCondition) {
    Message.success('Your page-level conditions have been converted to Flexible Flow conditions.');
  }

  // Return new AdvancedTimeline with flow and cleared page conditions
  return {
    ...advancedTimeline,
    flow,
    pages: advancedTimeline.pages.map(page => ({
      ...page,
      condition: undefined, // Clear page-level conditions since they're now in the flow
    })),
  };
}

/**
 * Check if a condition tree is empty (just an undefined leaf)
 */
function isEmptyCondition(condition: AT.ConditionTree): boolean {
  if ('children' in condition) {
    return false; // Has children, not empty
  }
  // Leaf node - check if data is [undefined]
  const data = condition.data;
  return Array.isArray(data) && data.length === 1 && data[0] === undefined;
}


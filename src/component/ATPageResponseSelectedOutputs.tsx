import { Checkbox, Space, Form } from '@arco-design/web-react';
import { IconExport } from '@arco-design/web-react/icon';
import React from 'react';
import type { SelectedOutputItem } from '../data/ampTypes';

const { useFormContext, useWatch } = Form;

export const ATPageResponseSelectedOutputs: React.FC<{ pageIndex: number }> = ({ pageIndex }) => {

  // Selected Output position in AmpTypes: .selectedOutputs.[{ type='response', page: thisPage }]
  const { form } = useFormContext();
  const selectedOutputsWatch = useWatch(`selectedOutputs`, form) as SelectedOutputItem[] | undefined;

  const responseItemIndex = selectedOutputsWatch?.findIndex(i => i.type === 'response' && i.page === pageIndex);
  const isResponseEnabled = responseItemIndex !== undefined && responseItemIndex >= 0;
  const actualResponseItemIndex = selectedOutputsWatch?.findIndex(i => i.type === 'actualResponse' && i.page === pageIndex);
  const isActualResponseEnabled = actualResponseItemIndex !== undefined && actualResponseItemIndex >= 0;

  const onCheckboxChange = (newValue: boolean, type: 'response' | 'actualResponse') => {
    if (newValue) {
      // Add to selectedOutputs
      const newItem: SelectedOutputItem = {
        type: type,
        page: pageIndex,
      };
      const newSelectedOutputs = [...(selectedOutputsWatch || []), newItem];
      form.setFieldValue(`selectedOutputs`, newSelectedOutputs);
    } else {
      // Remove from selectedOutputs
      const newSelectedOutputs = selectedOutputsWatch?.filter(i => !(i.type === type && i.page === pageIndex));
      form.setFieldValue(`selectedOutputs`, newSelectedOutputs);
    }
  };

  return (
    <Space style={{ margin: '10px 0' }}>
      <IconExport />
      <Checkbox checked={isResponseEnabled} onChange={v => onCheckboxChange(v, 'response')} />
      <div>Output response in embedded data</div>
      <Checkbox checked={isActualResponseEnabled} onChange={v => onCheckboxChange(v, 'actualResponse')} />
      <div>Output actual response (with swap) in embedded data</div>
    </Space>
  )
};

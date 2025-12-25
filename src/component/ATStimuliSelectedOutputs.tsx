import { Checkbox, Form, Space } from '@arco-design/web-react';
import { IconExport } from '@arco-design/web-react/icon';
import React from 'react';
import type { SelectedOutputItem } from '../data/ampTypes';

const { useFormContext, useWatch } = Form;

export const ATStimuliSelectedOutputs: React.FC<{ pageIndex: number; displayKey: string }> = ({
  pageIndex,
  displayKey,
}) => {
  // Selected Output position in AmpTypes: .selectedOutputs.[{ type='stimuliItem' | 'actualStimuliItem', page: thisPage, displayKey }]
  const { form } = useFormContext();
  const selectedOutputsWatch = useWatch('selectedOutputs', form) as SelectedOutputItem[] | undefined;

  const stimuliItemIndex = selectedOutputsWatch?.findIndex(
    i => i.type === 'stimuliItem' && i.page === pageIndex && i.displayKey === displayKey
  );
  const isStimuliItemEnabled = stimuliItemIndex !== undefined && stimuliItemIndex >= 0;

  const actualStimuliItemIndex = selectedOutputsWatch?.findIndex(
    i => i.type === 'actualStimuliItem' && i.page === pageIndex && i.displayKey === displayKey
  );
  const isActualStimuliItemEnabled = actualStimuliItemIndex !== undefined && actualStimuliItemIndex >= 0;

  const onCheckboxChange = (newValue: boolean, type: 'stimuliItem' | 'actualStimuliItem') => {
    if (newValue) {
      const newItem: SelectedOutputItem = {
        type,
        page: pageIndex,
        displayKey,
      };
      const newSelectedOutputs = [...(selectedOutputsWatch || []), newItem];
      form.setFieldValue('selectedOutputs', newSelectedOutputs);
    } else {
      const newSelectedOutputs = selectedOutputsWatch?.filter(
        i => !(i.type === type && i.page === pageIndex && i.displayKey === displayKey)
      );
      form.setFieldValue('selectedOutputs', newSelectedOutputs);
    }
  };

  // TODO: when freeform element name changes, if the outputName is default name, update it for the new element name

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Space>
        <Checkbox checked={isStimuliItemEnabled} onChange={v => onCheckboxChange(v, 'stimuliItem')} />
        <IconExport />
        <div>Output selection result</div>
      </Space>
      <Space>
        <Checkbox
          checked={isActualStimuliItemEnabled}
          onChange={v => onCheckboxChange(v, 'actualStimuliItem')}
        />
        <IconExport />
        <div>Output actual selection result</div>
      </Space>
    </div>
  );
};

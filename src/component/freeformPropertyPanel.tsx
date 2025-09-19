import { Divider, Form, Input, InputNumber, Select, Space, Typography } from '@arco-design/web-react';
import { AmpParams, AT } from '../data/ampTypes';
import { DeepPartial, traceSourcePools } from '../util/util';
import { ATLayoutItemSrcSelector } from './advancedTimeline';
import ATElementResponseConfig from './ATElementResponseConfig';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { StimuliThumbnail } from './stimuliThumbnail';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

const { Item } = Form;
const { Title } = Typography;


interface FreeformPropertyPanelProps {
  page: number;
  field: string;
  selectedElement: AT.FreeformLayout.ElementDisplayItem;
  updateElement: (element: AT.FreeformLayout.ElementDisplayItem, updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void;
}

export function FreeformPropertyPanel({ page, field, selectedElement, updateElement }: FreeformPropertyPanelProps) {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const mixedPoolsWatch = useWatch('mixedPools', form) as AmpParams['mixedPools'];

  const previewOptions = traceSourcePools(selectedElement.displayItem.displaySrc, mixedPoolsWatch)
    .flatMap(poolIndex =>
      stimuliWatch[poolIndex].items.map((item, itemIndex) => ({
        formValue: { poolIndex, itemIndex }, // for useEffect
        value: JSON.stringify({ poolIndex, itemIndex }),
        label: <StimuliThumbnail indexDisplay={`${poolIndex + 1}-${itemIndex + 1}`} type={item.type} content={item.content} />,
      })));

  // Use first valid preview item as default
  useEffect(() => {
    // invalid option -> undefined
    // valid option but undefined -> use first option
    if (!previewOptions.find(o => isEqual(o.formValue, selectedElement.previewStimuliItemRef)) && selectedElement.previewStimuliItemRef !== undefined) {
      updateElement(selectedElement, { previewStimuliItemRef: undefined });
    } else if (previewOptions.length > 0 && selectedElement.previewStimuliItemRef === undefined) {
      updateElement(selectedElement, { previewStimuliItemRef: previewOptions[0].formValue });
    }
  });

  return (
    <Space direction='vertical' style={{ width: '100%', padding: 20, boxSizing: 'border-box' }}>

      <Title heading={6}>Name</Title>
      <Input value={selectedElement.name} onChange={v => selectedElement && updateElement(selectedElement, { name: v })} />

      <Divider />

      <Title heading={6}>Layout</Title>
      <Form layout='horizontal' labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} >
        <Item label='Width'>
          <InputNumber value={selectedElement?.boxStyle.width} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { width: v } })} />
        </Item>
        <Item label='Height' >
          <InputNumber value={selectedElement?.boxStyle.height} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { height: v } })} />
        </Item>
        <Item label='x'>
          <InputNumber value={selectedElement?.boxStyle.x} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { x: v } })} />
        </Item>
        <Item label='y'>
          <InputNumber value={selectedElement?.boxStyle.y} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { y: v } })} />
        </Item>
        <Item label='Rotate'>
          <InputNumber value={selectedElement?.boxStyle.rotate} onChange={v => selectedElement && updateElement(selectedElement, { boxStyle: { rotate: v } })} suffix='°' />
        </Item>
      </Form>

      <Divider />

      <Title heading={6}>Stimuli Item</Title>
      <Item noStyle>
        <ATLayoutItemSrcSelector pageIndex={page} value={selectedElement.displayItem.displaySrc} onChange={v => updateElement(selectedElement, { displayItem: { displaySrc: v } })} />
      </Item>

      <Divider />

      <Title heading={6}>Response Config</Title>
      <ATElementResponseConfig pageIndex={page} field={`${field}.displayItem`} />

      <Divider />

      <Title heading={6}>Preview</Title>
      <Item noStyle>
        <Select options={previewOptions} style={{ width: '100%' }}
          value={JSON.stringify(selectedElement.previewStimuliItemRef)}
          onChange={v => updateElement(selectedElement, { previewStimuliItemRef: typeof v === 'string' ? JSON.parse(v) : undefined })}
        />
      </Item>

    </Space>
  );
}

export default FreeformPropertyPanel;

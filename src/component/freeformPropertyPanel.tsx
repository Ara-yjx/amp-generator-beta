import { Divider, Form, Input, InputNumber, Space, Typography } from '@arco-design/web-react';
import { AT } from '../data/ampTypes';
import { DeepPartial } from '../util/util';
import { ATLayoutItemSrcSelector } from './advancedTimeline';
import ATElementResponseConfig from './ATElementResponseConfig';

const { Item } = Form;
const { Title } = Typography;


interface FreeformPropertyPanelProps {
  page: number;
  field: string | null;
  selectedElement: AT.FreeformLayout.ElementDisplayItem | null;
  updateElement: (element: AT.FreeformLayout.ElementDisplayItem, updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void;
}

export function FreeformPropertyPanel({ page, field, selectedElement, updateElement }: FreeformPropertyPanelProps) {

  if (selectedElement === null || field === null) {
    return null;
  }

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
      <Item field={`${field}.displayItem.displaySrc`} noStyle>
        <ATLayoutItemSrcSelector pageIndex={page} value={selectedElement.displayItem.displaySrc} onChange={v => { console.log('ATLayoutItemSrcSelector', v); updateElement(selectedElement, { displayItem: { displaySrc: v } }) }} />
      </Item>

      <Divider />

      <Title heading={6}>Response Config</Title>
      <ATElementResponseConfig pageIndex={page} field={`${field}.displayItem`} />

    </Space>

  );

}

export default FreeformPropertyPanel;

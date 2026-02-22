import { Divider, Form, Input, InputNumber, Select, Space, Tooltip, Typography } from '@arco-design/web-react';
import { AmpParams, AT } from '../data/ampTypes';
import { DeepPartial, traceSourcePools } from '../util/util';
import { ATLayoutItemSrcSelector } from './advancedTimeline';
import ATElementResponseConfig from './ATElementResponseConfig';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { StimuliThumbnail } from './stimuliThumbnail';
import { useEffect } from 'react';
import { isEqual } from 'lodash';
import { ATStimuliSelectedOutputs } from './ATStimuliSelectedOutputs';
import { ConditionalShowHide } from './conditionalShowHide';
import { IconQuestionCircle } from '@arco-design/web-react/icon';

const { Item } = Form;
const { Title } = Typography;


interface FreeformPropertyPanelProps {
  elements: AT.FreeformLayout.ElementDisplayItem[];
  page: number;
  field: string;
  selectedElement: AT.FreeformLayout.ElementDisplayItem;
  patchElement: (element: AT.FreeformLayout.ElementDisplayItem, updates: DeepPartial<AT.FreeformLayout.ElementDisplayItem>) => void;
  updateElement: (newElement: AT.FreeformLayout.ElementDisplayItem) => void;
}

export function FreeformPropertyPanel({ elements, page, field, selectedElement, patchElement, updateElement }: FreeformPropertyPanelProps) {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const mixedPoolsWatch = useWatch('mixedPools', form) as AmpParams['mixedPools'];
  const pageResponseKeyboardWatch = useWatch(`advancedTimeline.pages[${page}].response.keyboard`, form) as AT.Page['response']['keyboard'];

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
      patchElement(selectedElement, { previewStimuliItemRef: undefined });
    } else if (previewOptions.length > 0 && selectedElement.previewStimuliItemRef === undefined) {
      patchElement(selectedElement, { previewStimuliItemRef: previewOptions[0].formValue });
    }
  });

  const isNameValid = elements.filter(e => e.name === selectedElement.name).length <= 1;

  return (
    <Space direction='vertical' size='mini' style={{ width: '100%', padding: 20, boxSizing: 'border-box' }} split={<Divider />}>

      <div>
        <Title heading={6}>Name</Title>
        <Item validateStatus={isNameValid ? undefined : 'error'} help={isNameValid ? undefined : 'Name must be unique'}>
          <Input value={selectedElement.name} onChange={v => selectedElement && patchElement(selectedElement, { name: v })} />
        </Item>
      </div>

      <div>
        <Title heading={6}>Layout</Title>
        <Form layout='horizontal' labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} >
          <Item label='Width'>
            <InputNumber value={selectedElement?.boxStyle.width} onChange={v => selectedElement && patchElement(selectedElement, { boxStyle: { width: v } })} />
          </Item>
          <Item label='Height' >
            <InputNumber value={selectedElement?.boxStyle.height} onChange={v => selectedElement && patchElement(selectedElement, { boxStyle: { height: v } })} />
          </Item>
          <Item label='x'>
            <InputNumber value={selectedElement?.boxStyle.x} onChange={v => selectedElement && patchElement(selectedElement, { boxStyle: { x: v } })} />
          </Item>
          <Item label='y'>
            <InputNumber value={selectedElement?.boxStyle.y} onChange={v => selectedElement && patchElement(selectedElement, { boxStyle: { y: v } })} />
          </Item>
          <Item label='Rotate'>
            <InputNumber value={selectedElement?.boxStyle.rotate} onChange={v => selectedElement && patchElement(selectedElement, { boxStyle: { rotate: v } })} suffix='°' />
          </Item>
        </Form>
      </div>

      <div>
        <Title heading={6}>Stimuli Item</Title>
        <ATLayoutItemSrcSelector pageIndex={page} value={selectedElement.displayItem.displaySrc} onChange={v => patchElement(selectedElement, { displayItem: { displaySrc: v } })} />
      </div>

      <div>
        <Title heading={6}>Response Config</Title>
        <ATElementResponseConfig value={selectedElement.displayItem} onChange={v => patchElement(selectedElement, { displayItem: v })} pageIndex={page} />
      </div>

      <div>
        <Title heading={6}>Conditional Show</Title>
        <ConditionalShowHide type='show' element={selectedElement} elements={elements} value={selectedElement.displayItem.conditionalShow} onChange={v => updateElement({...selectedElement, displayItem: { ...selectedElement.displayItem, conditionalShow: v } })} pageResponseKeyboardKeys={pageResponseKeyboardWatch?.enabled ? pageResponseKeyboardWatch.keys : undefined} />
        <Title heading={6}>Conditional Hide &nbsp;
          <Tooltip style={{ minWidth: '50em' }} content='If both Conditional Show and Hide are enabled, "Fixed duration" and "Mouse no movement" in Hide are timed after the Conditional Show, not since the page starts."' position='top'>
            <IconQuestionCircle />
          </Tooltip>
        </Title>
        <ConditionalShowHide type='hide' element={selectedElement} elements={elements} value={selectedElement.displayItem.conditionalHide} onChange={v => updateElement({...selectedElement, displayItem: { ...selectedElement.displayItem, conditionalHide: v } })} pageResponseKeyboardKeys={pageResponseKeyboardWatch?.enabled ? pageResponseKeyboardWatch.keys : undefined} />
      </div>

      <div>
        <Title heading={6}>Output to Embeded Data</Title>
        <ATStimuliSelectedOutputs pageIndex={page} displayKey={selectedElement.name} />
      </div>

      <div>
        <Title heading={6}>Preview</Title>
        <Select options={previewOptions} style={{ width: 160 }}
          value={JSON.stringify(selectedElement.previewStimuliItemRef)}
          onChange={v => patchElement(selectedElement, { previewStimuliItemRef: typeof v === 'string' ? JSON.parse(v) : undefined })}
        />
      </div>

    </Space>
  );
}

export default FreeformPropertyPanel;

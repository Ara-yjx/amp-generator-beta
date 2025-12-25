import React from 'react';
import { Collapse, Form, Input, Select, Button, Space } from '@arco-design/web-react';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import type { AT, SelectedOutputItem } from '../data/ampTypes';
import { getDefaultSelectedOutputName, getDisplayKey } from '../util/util';
import useOptionGuards from '../hooks/useOptionGuard';

const { Item } = Form;
const { Option } = Select;

const OutputRow: React.FC<{ item: any; index: number; remove: (index: number) => void }> = ({ item, index, remove }) => {
  const { form } = Form.useFormContext();
  const valueWatch = useWatch(`selectedOutputs[${index}]`, form) as SelectedOutputItem | undefined;
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[] | undefined;
  const pageCount = pagesWatch?.length ?? 1;
  const pageIndex = valueWatch?.page;

  const displayElementOptions = [];
  if (pageIndex !== undefined && pagesWatch && pagesWatch[pageIndex]) {
    const page = pagesWatch[pageIndex];
    if (valueWatch?.type && ['stimuliItem', 'actualStimuliItem'].includes(valueWatch.type)) {
      if (page.layoutType === 'freeform' && page.freeformDisplays) {
        for (const el of page.freeformDisplays?.elements.children ?? []) {
          displayElementOptions.push(el?.data.name);
        }
      } else { // grid layout
        page.layoutedDisplays.forEach((row, rowIndex) => {
          row.forEach((col, colIndex) => {
            displayElementOptions.push(getDisplayKey(rowIndex, colIndex));
          });
        });
      }
    }
  }
  useOptionGuards(`selectedOutputs[${index}].displayKey`, displayElementOptions);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Space>
        <Item
          field={`${item.field}.outputName`}
          label='Output Embedded Data Name'
        >
          <Input style={{ width: '15rem' }} placeholder={valueWatch && `${getDefaultSelectedOutputName(valueWatch, pagesWatch)}`} />
        </Item>
        <Item
          field={`${item.field}.page`}
          label='Page'
          rules={[{ required: true }]}
        >
          <Select style={{ width: 100 }}>
            {Array.from({ length: pageCount }, (_, pageIndex) => (
              <Option key={pageIndex} value={pageIndex}>
                #{pageIndex + 1}{pagesWatch?.[pageIndex]?.name ? ` (${pagesWatch[pageIndex].name})` : ''}
              </Option>
            ))}
          </Select>
        </Item>
        <Item
          field={`${item.field}.type`}
          label='Type'
          rules={[{ required: true }]}
        >
          <Select style={{ width: '20rem' }}>
            <Option value='stimuliItem'>Stimuli selection result</Option>
            <Option value='actualStimuliItem'>Actual stimuli selection result (with swap)</Option>
            <Option value='response'>Response</Option>
            <Option value='actualResponse'>Actual response (with swap)</Option>
          </Select>
        </Item>

        {valueWatch?.type && ['stimuliItem', 'actualStimuliItem'].includes(valueWatch.type) && (
          <Item
            field={`${item.field}.displayKey`}
            label='Display Element'
            rules={[{ required: true, message: 'Display key is required for display type' }]}
          >
            <Select style={{ width: '15rem' }} options={displayElementOptions}/>
          </Item>
        )}
      </Space>
      <Button
        icon={<IconDelete />}
        shape='circle'
        status='danger'
        onClick={() => remove(index)}
      />
    </div>
  );
};

export const SelectedOutput: React.FC = () => {
  const { form } = Form.useFormContext();
  const advancedTimeline = useWatch('advancedTimeline', form);

  if (!advancedTimeline) {
    return null;
  }

  return (
    <Collapse bordered={false} style={{ marginBottom: 20 }}>
      <Collapse.Item name='0' header={<h3>Output Specific Data</h3>}>
        <Form.List field='selectedOutputs'>
          {(fields, { add, remove, move }) => {
            return (
              <div>
                {fields.map((item, index) => (
                  <OutputRow key={item.key} item={item} index={index} remove={remove} />
                ))}

                <Button
                  type='outline'
                  icon={<IconPlus />}
                  onClick={() => {
                    add({
                      outputName: 'output' + (fields.length + 1),
                      type: 'stimuliItem',
                      page: 0,
                    } as SelectedOutputItem);
                  }}
                // style={{ width: '100%' }}
                >
                  Add Output
                </Button>
              </div>
            );
          }}
        </Form.List>
      </Collapse.Item>
    </Collapse>
  );
};

export default SelectedOutput;
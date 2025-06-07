import { Button, Checkbox, Form, Input, Popover, Space } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconBgColors, IconDelete, IconPlus } from '@arco-design/web-react/icon';
import React from 'react';
import { AmpParams, AmpStimuliItem, Label } from '../data/ampTypes';
import { uid } from '../data/uid';
import { ArcoFormItem } from '../util/arco';
import { CompactPicker } from 'react-color';

const { Item } = Form;

// const TWITTER_PICKER_COLORS = ['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'];
const ARCO_COLORS_5 = ['#F76560', '#F99057', '#FF9A2E', '#F9CC45', '#FBE842', '#B5E241', '#23C343', '#37D4CF', '#57A9FB', '#4080FF', '#8D4EDA', '#E13EDB', '#F754A8', '#a9aeb8'];
const COLORS = ARCO_COLORS_5;

const LabelColorPicker: React.FC<ArcoFormItem<string>> = ({ value, onChange }) => {
  return (
    <CompactPicker color={value ?? '#000'} onChange={v => onChange?.(v.hex)} colors={COLORS} />
  );
}

const LabelsSelector: React.FC<{
  field: string;
}> = ({ field }) => {

  const { form } = useFormContext();
  const itemLabelsWatch = useWatch(`${field}.labels`, form) as AmpStimuliItem['labels'] | undefined;
  const labelsWatch = useWatch(`labels`, form) as AmpParams['labels'] | undefined;
  return (

    <Form.List field='labels'>

      {(labelsFields, { add, remove, move }) => {

        const addNewLabel = () => {
          add({ name: `label-${labelsFields.length + 1}`, color: COLORS[labelsFields.length % COLORS.length], uid: uid() } as Label);
        };

        return (
          <Space direction='vertical' style={{ width: 240 }}>
            {
              labelsFields.map((labelFieldAndKey, index) => {
                const color = labelsWatch?.[index]?.color;
                const uid = labelsWatch?.[index]?.uid;
                const isLabelApplied = uid !== undefined && itemLabelsWatch?.includes(uid);
                const onCheckboxChange = (v: boolean) => {
                  // console.log('Checkbox changed:', v, 'for label uid:', uid, itemLabelsWatch);
                  if (v) { // Add label to itemLabels if not already present
                    if (uid !== undefined && !itemLabelsWatch?.includes(uid)) {
                      form.setFieldValue(`${field}.labels`, [...itemLabelsWatch ?? [], uid]);
                    }
                  } else { // Remove label from itemLabels if present
                    if (uid !== undefined && itemLabelsWatch?.includes(uid)) {
                      form.setFieldValue(`${field}.labels`, itemLabelsWatch?.filter(labelUid => labelUid !== uid));
                    }
                  }
                }
                return (
                  <Space key={uid} style={{ width: '100%' }} size={'small'}> {/* Arco bug if use key={labelFieldAndKey.key} here */}
                    <Checkbox
                      checked={isLabelApplied}
                      onChange={onCheckboxChange}
                    />
                    <Item field={`${labelFieldAndKey.field}.name`} label='Name' noStyle>
                      <Input
                        placeholder='Label name'
                        style={{ width: 100, backgroundColor: color }}
                      />
                    </Item>
                    <Popover
                      trigger='click'
                      position='right'
                      content={
                        <Item field={`${labelFieldAndKey.field}.color`} label='Color' noStyle>
                          <LabelColorPicker />
                        </Item>
                      }
                    >
                      <Button icon={<IconBgColors />} />
                    </Popover>
                    <Button shape='circle' icon={<IconDelete />} status='danger' onClick={() => remove(index)} />
                  </Space>
                );
              })
            }

            <Button icon={<IconPlus />} onClick={addNewLabel} style={{ width: '100%' }}>
              Add New Label
            </Button>

          </Space>
        )
      }}
    </Form.List>
  );
};


/** Just for thumbnail display. Editing is in LabelsSelector. */
export const StimuliItemLabelsEditor: React.FC<{ field: string }> = ({ field }) => {
  const { form } = useFormContext();
  const itemLabelsWatch = useWatch(`${field}.labels`, form) as AmpStimuliItem['labels'] | undefined;
  const labelsWatch = useWatch(`labels`, form) as AmpParams['labels'] | undefined;
  const itemLabelsColors = labelsWatch?.filter(
    label => itemLabelsWatch?.includes(label.uid)
  ).map(
    label => label.color
  ) ?? []; // is sorted by label's index
  return (
    <Popover
      trigger='click'
      position='bottom'
      content={<LabelsSelector field={field} />}
    >
      <Button style={{ width: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', padding: 4 }}>
        {
          itemLabelsColors.map((color, index) => (
            <div key={index} style={{ flexBasis: '20px', backgroundColor: color }}>
              {/* {color} */}
            </div>
          ))
        }
      </Button>
    </Popover>
  )
}

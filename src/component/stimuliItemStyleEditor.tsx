import { Button, Checkbox, Form, FormItemProps, InputNumber, Modal, Select, Space } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconAlignLeft, IconBgColors, IconFontColors, IconLineHeight } from '@arco-design/web-react/icon';
import React, { ReactNode } from 'react';
import { AmpStimuliItem, AmpStimuliStyle } from '../data/ampTypes';
import { emptyAmpParams } from '../data/emptyAmpParams';
import { jsonFormatterAndNormalize } from '../util/jsonFormatterAndNormalize';
import { TextColorPicker } from './textColorPicker';

const { Item } = Form;

const defaultStyleValue: AmpStimuliStyle = {
  fontSize: emptyAmpParams.trialHtml.textFontSize,
  color: '#000',
  textAlign: 'center',
  buttonPaddingTopBottom: 0,
  buttonPaddingLeftRight: 4,
  loop: true,
  muted: false,
};

/** Field can be either or AmpStimuliItem or AmpStimuli */
export const StimuliItemStyleEditor: React.FC<{ field: string, isForPool?: boolean }> = ({ field, isForPool }) => {
  const { form } = useFormContext();
  const itemTypeWatch = (useWatch(`${field}.type`, form) as AmpStimuliItem['type'] | undefined) ?? 'all';
  const styleWatch = useWatch(`${field}.style`, form) as AmpStimuliStyle | undefined;
  const [visible, setVisible] = React.useState(false);

  const ItemStyleAttributeEditor: React.FC<React.PropsWithChildren<{
    propertyName: keyof AmpStimuliStyle,
    applicableTypes: AmpStimuliItem['type'][],
    label: ReactNode,
    formatter?: FormItemProps['formatter'],
    normalize?: FormItemProps['normalize'],
  }>> = ({ applicableTypes, propertyName, label, formatter, normalize, children }) => (
    // TODO: separate "enable" checkbox and the value input
    (itemTypeWatch === 'all' || applicableTypes.includes(itemTypeWatch)) ? (
      <Space style={{ width: '100%' }} size={0}>
        <Item layout='inline'>
          <Checkbox
            checked={styleWatch?.[propertyName] !== undefined}
            onChange={value => form.setFieldValue(`${field}.style.${propertyName}`, value ? defaultStyleValue[propertyName] : undefined)}
          />
        </Item>
        <Item 
          field={`${field}.style.${propertyName}`} label={label} layout='inline' 
          disabled={styleWatch?.[propertyName] === undefined}
          formatter={formatter} normalize={normalize}
        >
          {children}
        </Item>
      </Space>
    ) : null
  );


  return (
    <div>
      <Button
        icon={<IconFontColors />}
        style={{ color: styleWatch?.color }}
        type='secondary'
        disabled={itemTypeWatch === 'image'}
        onClick={() => setVisible(true)}
      />
      <Modal
        title={isForPool ? 'Customize the style of all stimuli items in this pool' : 'Customize stimuli item style'}
        visible={visible}
        onOk={() => setVisible(false)}
        closable={false}
        footer={(cancelButtonNode: ReactNode, okButtonNode: ReactNode) => okButtonNode}
        okText='Save'
        autoFocus={false}
        focusLock={true}
      >
        <ItemStyleAttributeEditor propertyName='fontSize' applicableTypes={['text', 'button']} label={<><IconLineHeight />&nbsp;Font size</>}>
          <InputNumber min={1} suffix='px' style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor propertyName='color' applicableTypes={['text', 'button']} label={<><IconBgColors />&nbsp;Font color</>}>
          <TextColorPicker showUseDefaultButton={false} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor propertyName='textAlign' applicableTypes={['text']} label={<><IconAlignLeft />&nbsp;Text align</>}>
          <Select options={['left', 'center', 'right']} style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor propertyName='buttonPaddingTopBottom' applicableTypes={['button']} label='Button padding (top and bottom)'>
          <InputNumber min={0} suffix='px' style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor propertyName='buttonPaddingLeftRight' applicableTypes={['button']} label='Button padding (left and right)'>
          <InputNumber min={0} suffix='px' style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor
          propertyName='loop' applicableTypes={['video']} label='Loop video/audio'
          {...jsonFormatterAndNormalize}
        >
          <Select options={[{ label: 'Loop', value: 'true' }, { label: 'No loop', value: 'false' }]} style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        <ItemStyleAttributeEditor
          propertyName='muted' applicableTypes={['video']} label='Mute video'
          {...jsonFormatterAndNormalize}
        >
          <Select options={[{ label: 'Muted', value: 'true' }, { label: 'Unmuted', value: 'false' }]} style={{ width: 120 }} />
        </ItemStyleAttributeEditor>
        {
          itemTypeWatch === 'image' && (
            <p>Image stimuli does not support customize style yet.</p>
          )
        }
      </Modal>
    </div>
  );
};

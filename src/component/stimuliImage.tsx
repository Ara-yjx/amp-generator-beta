import { Button, Checkbox, Divider, Form, FormItemProps, Grid, Image, Input, InputNumber, Modal, Select, Space, Switch, Tooltip, Typography } from '@arco-design/web-react';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconAlignLeft, IconArrowDown, IconArrowUp, IconBgColors, IconDelete, IconFontColors, IconLineHeight, IconPlus, IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { ReactNode, useContext, useEffect } from 'react';
import { AmpStimuli, AmpStimuliItem, AmpStimuliStyle } from '../data/ampTypes';
import { uid } from '../data/uid';
import { PrimeValidationContext } from './PrimeValidationContext';
import { Prime } from './prime';
import sumBy from 'lodash/sumBy';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import { emptyAmpParams } from '../data/emptyAmpParams';
import { TextColorPicker } from './textColorPicker';
import { jsonFormatterAndNormalize } from '../util/jsonFormatterAndNormalize';


const { Item, List } = Form;
const { Row, Col } = Grid;
const { Text } = Typography;

const WIDTH_INDEX_COL = 40;
const WIDTH_TYPE_SELECTOR = 130;
const WIDTH_IMAGE_PREVIEW = 32; // same as Button of size='default' 
const GUTTER = 10;

const InputShuffle: React.FC<{ value?: any, onChange?: (v: any) => any }> = ({ value, onChange }) => {
  const onShuffleSwitchChange = (v: boolean) => { onChange?.(v); }
  const onMaxRepeatSwitchChange = (v: boolean) => { v ? onChange?.(1) : onChange?.(true); }
  const onMaxRepeatNumberChange = (v: number) => { onChange?.(v); }
  const isShuffleEnabled = value === true || typeof value === 'number';
  const isMaxRepeatEnabled = typeof value === 'number';
  const maxRepeatValue = typeof value === 'number' ? value : undefined;
  const tooltip = (
    <Tooltip style={{ minWidth: '50em' }} content={
      <div>
        You can access the randomization result through these embeeded data:
        <li>{`shuffled_{roundIndex}_{poolIndex}_{shuffledIndex}_item_index`}</li>
        <li>{`shuffled_{roundIndex}_{poolIndex}_{shuffledIndex}_content`}</li>
        <li>{`shuffled_{roundIndex}_{poolIndex}_{shuffledIndex}_type`}</li>
        For example, "shuffled_1_2_3_content" gives you the <i>content</i> of the stimuli item which is at the <i>3rd position</i> after shuffling <i>Pool 2</i> in trial <i>Round 1</i>.
        <li>If you did not check "Add more rounds" below, always use "1" for "roundIndex".</li>
        <li>If shuffle is disbled, then the default item order is looping through all the items.</li>
      </div>
    } position='top'>
      <IconQuestionCircle />
    </Tooltip>
  );
  return (
    <Space style={{ display: 'flex' }}>
      <Text type='secondary'>Shuffle</Text>
      <Switch checked={isShuffleEnabled} onChange={onShuffleSwitchChange} />
      <Text type='secondary'>Restrict max repeat</Text>
      <Switch disabled={!isShuffleEnabled} checked={isMaxRepeatEnabled} onChange={onMaxRepeatSwitchChange} />
      <InputNumber min={1} disabled={!isMaxRepeatEnabled} value={maxRepeatValue} onChange={onMaxRepeatNumberChange} />
      {tooltip}
    </Space>
  )
}

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
const ItemStyleEditor: React.FC<{ field: string, isForPool?: boolean }> = ({ field, isForPool }) => {
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
          <TextColorPicker showLabel={false} showUseDefaultButton={false} />
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

const ImagePreview: React.FC<{ value?: AmpStimuliItem }> = ({ value }) => (
  <Image src={value?.content} width={`${WIDTH_IMAGE_PREVIEW}px`} height={`${WIDTH_IMAGE_PREVIEW}px`} />
);

const VideoPreview: React.FC<{ value?: AmpStimuliItem }> = ({ value }) => {
  return (
    <div style={{ width: WIDTH_IMAGE_PREVIEW, height: WIDTH_IMAGE_PREVIEW }}>
      <a href={value?.content} target='_blank'>
        <video src={value?.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted />
      </a>
    </div>
  )
};

const ImageItem: React.FC<{
  field: any,
  index: number,
  length: number,
  operation: { add: (defaultValue?: any, index?: number) => void; remove: (index: number) => void; move: (fromIndex: number, toIndex: number) => void; }
}> = ({ field, index, length, operation }) => {
  const { remove, move } = operation;
  const onClickRemove = () => { remove(index); };
  const onClickUp = () => { move(index, index - 1); };
  const onClickDown = () => { move(index, index + 1); };
  const { form } = useFormContext();
  const value = useWatch(field, form) as AmpStimuliItem | undefined;
  
  // When set to camera type, clear content
  useEffect(() => {
    if (value?.type === 'camera' && value?.content !== undefined) {
      form.setFieldValue(`${field}.content`, undefined);
    }
  }, [value?.type]);

  return (
    <div>
      <Row gutter={GUTTER} align='start' style={{ margin: 10 }}>
        <Col flex={`${WIDTH_INDEX_COL}px`}>
          <Text>{index + 1}</Text>
        </Col>
        <Col flex={`${WIDTH_TYPE_SELECTOR + GUTTER}px`}>
          <Item field={field + '.type'} noStyle>
            <Select options={['image', 'text', { label: 'video/audio', value: 'video' }, 'button', 'camera']} style={{ width: WIDTH_TYPE_SELECTOR }} />
          </Item>
        </Col>
        <Col flex={1}>
          <Item field={field + '.content'} noStyle>
            {
              () => {
                if (value?.type === 'text') {
                  return <Input.TextArea autoSize />;
                } else if (value?.type === 'camera') {
                  return <Input disabled/>;
                } else {
                  return <Input />;
                }
              }
            }
          </Item>
        </Col>
        <Col flex={`${WIDTH_IMAGE_PREVIEW + GUTTER}px`}>
          {value?.type === 'image' && <ImagePreview value={value} />}
          {value?.type === 'video' && <VideoPreview value={value} />}
        </Col>
        <Col flex={`${WIDTH_IMAGE_PREVIEW + GUTTER}px`}>
          <ItemStyleEditor field={field} />
        </Col>
        <Col flex='100px'>
          <Item field={field + '.count'} noStyle>
            <InputNumber min={0} />
          </Item>
        </Col>
        <Col flex='none'>
          <Space>
            <Button shape='circle' icon={<IconArrowUp />} style={{ visibility: index !== 0 ? 'visible' : 'hidden' }} onClick={onClickUp} />
            <Button shape='circle' icon={<IconArrowDown />} style={{ visibility: index !== length - 1 ? 'visible' : 'hidden' }} onClick={onClickDown} />
            <Button shape='circle' icon={<IconDelete />} status='danger' onClick={onClickRemove} />
          </Space>
        </Col>
      </Row>
    </div>
  )
};


const ItemsCountWithPrime: React.FC<{ field: string, index: number }> = ({ field, index }) => {
  const { form } = Form.useFormContext();
  const stimuli = Form.useWatch(field, form) as AmpStimuli;
  const totalRounds = Form.useWatch('totalRounds', form) as number;
  const primeValidation = useContext(PrimeValidationContext);

  if (stimuli.isEnablePriming && primeValidation) {
    const possibleTotalItems = primeValidation?.possibleTotalItems;
    const poolPossibleTotalItems = possibleTotalItems[index];
    return (
      <div style={{ textAlign: 'left' }}>
        <Text type='secondary'>
          {'Possible total items count: '}
          {
            poolPossibleTotalItems && (
              totalRounds === 1 ? (
                poolPossibleTotalItems[0].join(', ')
              ) : (
                poolPossibleTotalItems.map((counts, roundIndex) => (
                  <li>{`Round ${roundIndex + 1}: ${counts.join(', ')}`}</li>
                ))
              )
            )
          }
        </Text>
      </div>
    );

  } else if (!stimuli.isEnablePriming) {
    return (
      <div style={{ textAlign: 'left' }}>
        <Text type='secondary'>
          {'Total items count: '}
          {sumBy(stimuli.items, x => x.count)}
        </Text>
      </div>
    );

  } else {
    return null;
  }
};


export const StimuliImage: React.FC<{ field: string, index: number }> = ({ field, index }) => {
  const { form } = Form.useFormContext();
  const totalItems = useWatch(field + '.items', form) as AmpStimuliItem[];

  return (
    <>
      <Row gutter={GUTTER} align='center' style={{ margin: 10, textAlign: 'left' }}>
        <Col flex={`${WIDTH_INDEX_COL}px`} />
        <Col flex={`${WIDTH_TYPE_SELECTOR + GUTTER}px`}>
          Type
        </Col>
        <Col flex={1}>
          Image URL or Text Content
        </Col>
        <Col flex={`${WIDTH_IMAGE_PREVIEW + GUTTER}px`}>
          <ItemStyleEditor field={field} isForPool />
        </Col>
        <Col flex='100px'>
          Count
        </Col>
        <Col flex='122px' />
      </Row>
      <List field={field + '.items'}>
        {
          (fields, operation) => {
            const { add } = operation;
            const onClickAdd = () => {
              if (fields.length) {
                const lastItem = form.getFieldValue(fields[fields.length - 1].field);
                add({ ...lastItem, uid: uid() });
              } else {
                add({ type: 'text', content: '', count: 1, uid: uid() } as AmpStimuliItem)
              }
            };
            return (
              <>
                {
                  fields.map(({ key, field }, index) => {
                    return <ImageItem field={field} index={index} key={key} length={fields.length} operation={operation} />
                  })
                }
                <Row style={{ paddingLeft: WIDTH_INDEX_COL }}>
                  <Space>
                    <Button shape='round' onClick={onClickAdd} type='outline'>
                      <IconPlus />Add Item
                    </Button>
                  </Space>
                </Row>
              </>
            )
          }
        }
      </List>
      <br />
      <Item field={field + '.shuffle'}>
        <InputShuffle />
      </Item>
      <Divider />
      <Prime field={field} poolIndex={index} />
      <Divider />
      <ItemsCountWithPrime field={field} index={index} />
    </>
  );
}

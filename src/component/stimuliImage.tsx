import { Button, Divider, Form, Grid, Image, Input, InputNumber, Space, Switch, Typography } from '@arco-design/web-react';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@arco-design/web-react/icon';
import sumBy from 'lodash/sumBy';
import React from 'react';
import { Prime } from './prime';
import { uid } from '../data/uid';

const { Item, List } = Form;
const { Row, Col } = Grid;
const { Text } = Typography;

const InputShuffle: React.FC<{ value?: any, onChange?: (v: any) => any }> = ({ value, onChange }) => {
  const onShuffleSwitchChange = (v: boolean) => { onChange?.(v); }
  const onMaxRepeatSwitchChange = (v: boolean) => { v ? onChange?.(1) : onChange?.(true); }
  const onMaxRepeatNumberChange = (v: number) => { onChange?.(v); }
  const isShuffleEnabled = value === true || typeof value === 'number';
  const isMaxRepeatEnabled = typeof value === 'number';
  const maxRepeatValue = typeof value === 'number' ? value : undefined;
  return (
    <Space style={{ display: 'flex' }}>
      <Text type='secondary'>Shuffle</Text>
      <Switch checked={isShuffleEnabled} onChange={onShuffleSwitchChange} />
      <Text type='secondary'>Restrict max repeat</Text>
      <Switch disabled={!isShuffleEnabled} checked={isMaxRepeatEnabled} onChange={onMaxRepeatSwitchChange} />
      <InputNumber min={1} disabled={!isMaxRepeatEnabled} value={maxRepeatValue} onChange={onMaxRepeatNumberChange} />
    </Space>
  )
}

const ImagePreview: React.FC<{ value?: string }> = ({ value }) => (
  <Image src={value} width='32px' height='32px' />
);

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
  return (
    <div>
      <Row gutter={10} align='center' style={{ margin: 10 }}>
        <Col flex='none' style={{ width: 40 }}>
          <Text>{index + 1}</Text>
        </Col>
        <Col flex={1}>
          <Item field={field + '.content'} noStyle required>
            <Input required />
          </Item>
        </Col>
        <Col flex='none'>
          <Item shouldUpdate field={field + '.content'} noStyle>
            <ImagePreview />
          </Item>
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

const TotalImagesCount = ({ value }: { value?: any[] }) => (
  <Text type='secondary'>
    Total Images Count: {sumBy(value, i => i.count)}
  </Text>
);

export const StimuliImage: React.FC<{ field: string }> = ({ field }) => {
  return (
    <>
      <Row justify='space-between'>
        <Col style={{ marginLeft: 40 }} flex='none'>
          Image URL
        </Col>
        <Col style={{ width: 212, textAlign: 'left' }} flex='none'>
          Count
        </Col>
      </Row>
      <List field={field + '.items'}>
        {
          (fields, operation) => {
            const { add } = operation;
            const onClickAdd = () => { add({ content: '', count: 1, uid: uid() }) };
            return (
              <>
                {
                  fields.map(({ key, field }, index) => {
                    return <ImageItem field={field} index={index} key={key} length={fields.length} operation={operation} />
                  })
                }
                <Row style={{ paddingLeft: 40 }}>
                  <Space>
                    <Button shape='round' onClick={onClickAdd} type='outline'>
                      <IconPlus />Add Image
                    </Button>
                    <Item field={field + '.items'} noStyle>
                      <TotalImagesCount />
                    </Item>
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
      <Prime field={field} />
    </>
  );
}

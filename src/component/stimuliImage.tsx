import { Button, Form, Grid, Image, Input, InputNumber, Space, Switch, Typography } from '@arco-design/web-react';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@arco-design/web-react/icon';
import React from 'react';

const { Item, List } = Form;
const { Row, Col } = Grid;
const { Text } = Typography;

const Shuffle: React.FC<{ field: string }> = ({ field }) => (
  <Space style={{ display: 'flex' }}>
    <Text type='secondary'>Shuffle</Text>
    <Item field={field + '.shuffle'} noStyle>
      <Switch />
    </Item>
    {/* <Text type='secondary'>Max repeat when shuffle</Text>
    <Item field={field + '.shuffleMaxRepeat'} noStyle>
      <InputNumber min={0} style={{ width: 200 }} />
    </Item> */}
  </Space>
)

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
          <Text>{index}</Text>
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
}

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
            const onClickAdd = () => { add({ content: '', count: 1 }) };
            return (
              <>
                {
                  fields.map(({ key, field }, index) => {
                    return <ImageItem field={field} index={index} key={key} length={fields.length} operation={operation} />
                  })
                }
                <Row>
                  <Col style={{ marginLeft: 40 }} flex='none' >
                    <Button shape='round' onClick={onClickAdd} type='outline'><IconPlus />Add Image</Button>
                  </Col>
                </Row>
              </>
            )
          }
        }
      </List>
      <br/>
      <Shuffle field={field} />
    </>
  );
}

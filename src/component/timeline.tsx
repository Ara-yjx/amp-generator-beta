import { Card, Form, Grid, InputNumber, Tag, Tooltip, Typography } from '@arco-design/web-react';
import { IconQuestionCircle, IconRight } from '@arco-design/web-react/icon';
import React from 'react';

const { Item } = Form;
const { Row, Col } = Grid;
const { Text } = Typography;

export const Timeline: React.FC = () => {
  return (
    <Card>
      <Row>

      </Row>
      <Row>
        <Col span={3}>
          <Tag bordered color='blue' style={{ width: '100%' }}>Stimuli 1</Tag>
        </Col>
        <Col span={1}><IconRight /></Col>
        <Col span={2}>
          <Text type='secondary' style={{ fontSize: '90%' }}>interval</Text>
        </Col>
        <Col span={1}><IconRight /></Col>
        <Col span={3}>
          <Tag bordered color='blue' style={{ width: '100%' }}>Stimuli 2</Tag>
        </Col>
        <Col span={1}><IconRight /></Col>
        <Col span={2}>
          <Text type='secondary' style={{ fontSize: '90%' }}>interval</Text>
        </Col>
        <Col span={1}><IconRight /></Col>
        <Col span={10}>
          <Tag bordered color='blue' style={{ width: '100%' }}>Stimuli 3</Tag>
        </Col>
      </Row>
      <Row align='center'>
        <Col span={3}>
          <Item field='timeline[0]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
        <Col span={2} offset={1}>
          <Item field='timeline[1]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
        <Col span={3} offset={1}>
          <Item field='timeline[2]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
        <Col span={2} offset={1}>
          <Item field='timeline[3]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
        <Col span={3} offset={1}>
          <Item field='timeline[4]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
        <Col span={4}>
          <Tag bordered color='green' style={{ width: '100%' }}>... Await keyboard input</Tag>
        </Col>
        <Col span={3}>
          <Item field='timeline[5]' noStyle><InputNumber suffix='ms'/></Item>
        </Col>
      </Row>
      <Row align='center'>
        <Col span={3} offset={14}>
          <Tooltip content='This is the interval between displaying Stimuli 3 and start accepting keyboard input. ("Retard")' position='bottom'>
            <IconQuestionCircle/>
          </Tooltip>
        </Col>
        <Col span={3} offset={4}>
          <Tooltip content='This is the delay after receiving keyboard input and continuing to the next trial. ("Retention")' position='bottom'>
            <IconQuestionCircle/>
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
}
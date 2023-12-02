import { Card, Form, InputNumber, Space, Tag, Tooltip, Typography } from '@arco-design/web-react';
import { IconArrowFall, IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { useEffect } from 'react';
import type { AmpStimuli, AmpTimeline } from '../data/ampTypes';

const { Item } = Form;
const { Text } = Typography;

export const Timeline: React.FC = () => {

  const { form } = Form.useFormContext();
  const stimuliWatch = Form.useWatch('stimuli', form) as AmpStimuli[];
  const timelineWatch = Form.useWatch('timeline', form) as AmpTimeline;
  const timelineStimuliCount = timelineWatch.durationsAndIntervals.length + 1;

  // Adjust with stimuli length
  // TODO: when delete stimuli pool, better if delete the corresponding durationsAndIntervals (instead of the last one)
  useEffect(() => {
    const durationsAndIntervals = form.getFieldValue('timeline.durationsAndIntervals') as AmpTimeline['durationsAndIntervals'];
    const sliced = [...durationsAndIntervals, ...Array(stimuliWatch.length).fill([100, 0])].slice(0, stimuliWatch.length - 1);
    form.setFieldValue('timeline.durationsAndIntervals', sliced);
  }, [stimuliWatch.length]);

  return (
    <Card style={{ textAlign: 'start' }}>
      {
        timelineWatch.durationsAndIntervals.map((_: any, index: any) => (
          <>
            <div style={{ margin: 10, display: 'flex', height: 30, justifyContent: 'flex-start', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', height: 30 }}><IconArrowFall /></div>
              <Tag bordered color='blue' size='medium' style={{ width: 100, height: 30, textAlign: 'center' }}>
                Stimuli {index + 1}
              </Tag>
              <Item field={`timeline.durationsAndIntervals[${index}][0]`} noStyle rules={[{ required: true }]}>
                <InputNumber suffix='ms' min={0} style={{ width: 200 }} />
              </Item>
            </div>
            <div style={{ margin: 10, display: 'flex', height: 30, justifyContent: 'flex-start', alignItems: 'center', gap: 10 }}>
              <IconArrowFall />
              <div style={{ width: 100, textAlign: 'center' }}>
                <Text type='secondary'  >interval</Text>
              </div>
              <Item field={`timeline.durationsAndIntervals[${index}][1]`} noStyle rules={[{ required: true }]}>
                <InputNumber suffix='ms' min={0} style={{ width: 200 }} />
              </Item>
            </div>
          </>
        ))
      }
      <div style={{ margin: 10, display: 'flex', height: 30 * 3 + 10 * 2, justifyContent: 'flex-start', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 30, alignSelf: 'start' }}><IconArrowFall /></div>
        <Tag bordered color='blue' size='medium' style={{ width: 100, height: '100%', textAlign: 'center' }}>
          Stimuli {timelineStimuliCount}
        </Tag>
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
          <Space style={{ height: 30 }}>
            <Space style={{ width: 180 }}>
              <Text type='secondary'>Delay before keyboard</Text>
              <Tooltip content={`This is the interval between displaying Stimuli ${timelineStimuliCount} and start accepting keyboard input. ("Retard")`} position='bottom'>
                <IconQuestionCircle />
              </Tooltip>
            </Space>
            <Item field='timeline.delayBeforeKeyboard' noStyle>
              <InputNumber suffix='ms' min={0} />
            </Item>
          </Space>
          <Tag bordered color='green' size='medium' style={{ height: 30, textAlign: 'center' }}>
            ... await keyboard input ...
          </Tag>
          <Space style={{ height: 30 }}>
            <Space style={{ width: 180 }}>
              <Text type='secondary'>Delay before keyboard</Text>
              <Tooltip content='This is the delay after receiving keyboard input and continuing to the next trial. ("Retention")' position='bottom'>
                <IconQuestionCircle />
              </Tooltip>
            </Space>
            <Item field='timeline.delayAfterKeyboard' noStyle>
              <InputNumber suffix='ms' min={0} />
            </Item>
          </Space>
        </div>
      </div>
    </Card>
  );
}

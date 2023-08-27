
import React, { useRef, useEffect, useState } from 'react';
import { Form, Input, Button, Checkbox, InputNumber, InputTag, type FormInstance, Tabs, Switch, Card, Collapse } from '@arco-design/web-react';
import { defaultAmpParams } from '../data/defaultAmpParams';
import type { AmpParams } from '../data/ampTypes';
import { generateBlob, generateQsfString } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Timeline } from './timeline';
import { StimuliImage } from './stimuliImage';
import { TrialHtml } from './trialHtml';
import { WarnTrialNumber } from './warnTrialNumber';
import { AcceptedKeys } from './acceptedKeys';
import { NextTrialTimeout } from './nextTrialTimeout';

const { Item } = Form;
const { TabPane } = Tabs;

const DownloadButton: React.FC<{ blob?: Blob }> = ({ blob }) => {
  const href = useBlobUrl(blob);
  console.log('href', href);
  return (
    <Button type='primary' href={href} download='amp.qsf'>
      Generate Qualtrics qsf File
    </Button>
  );
}


export const MainForm: React.FC<{}> = ({ }) => {

  console.log('MainForm')
  const formRef = useRef<FormInstance<AmpParams>>(null);


  const onValuesChange = (changeValue: Partial<AmpParams>, values: Partial<AmpParams>) => {
    console.log('onValuesChange: ', changeValue, values);
  };

  return (
    <>
      <Form
        layout='vertical'
        ref={formRef}
        initialValues={defaultAmpParams}
        onValuesChange={onValuesChange}
      >
        <Item label={<h3>Stimuli Images</h3>}>
          <Card>
            <Tabs defaultActiveTab='0'>
              <TabPane key='0' title='Stimuli 1'>
                <StimuliImage field={`stimuli[0]`} />
              </TabPane>
              <TabPane key='1' title='Stimuli 2'>
                <StimuliImage field={`stimuli[1]`} />
              </TabPane>
              <TabPane key='2' title='Stimuli 3'>
                <StimuliImage field={`stimuli[2]`} />
              </TabPane>
            </Tabs>
          </Card>
        </Item>

        <Item label={<h3>Trial timeline</h3>} field='timeline'>
          <Timeline />
        </Item>

        <span style={{ textAlign: 'left' }}>
          <Item label='Number of total trials' field='totalTrials' >
            <InputNumber min={0} style={{ width: 200 }} />
          </Item>
          <Item shouldUpdate noStyle>
            { values => <WarnTrialNumber values={values} />}
          </Item>
          <Item 
            label='Accepted keyboard responses' field='acceptedKeys' 
            extra='Letters (case insensitive), Number digits, Arrow keys.'
          >
            <AcceptedKeys />
          </Item>
          <Item field='nextTrialTimeout'>
            <NextTrialTimeout />
          </Item>
        </span>

        <Collapse bordered={false} style={{ marginBottom: 20 }}>
          <Collapse.Item name='0' header={<h3>Trial Block HTML</h3>}>
            <Item field='trialHtml'>
              <TrialHtml />
            </Item>
          </Collapse.Item>
        </Collapse>

        <Item shouldUpdate>
          {
            values => (
              <DownloadButton blob={generateBlob(generateQsfString(values))} />
            )
          }
        </Item>
      </Form>
    </>
  )
}

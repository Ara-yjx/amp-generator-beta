
import React, { useRef, useEffect, useState } from 'react';
import { Form, Input, Button, Checkbox, InputNumber, InputTag, FormInstance, Tabs, Switch, Card } from '@arco-design/web-react';
import { defaultAmpParams } from '../data/defaultAmpParams';
import type { AmpParams } from '../data/ampTypes';
import { generateBlob, generateQsfString } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Timeline } from './timeline';
import { StimuliImage } from './stimuliImage';

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
        <Item label='Number of total trials' field='totalTrials' style={{ textAlign: 'left' }}>
          <InputNumber min={0} style={{ width: 200 }} />
        </Item>
        <Item label='Accepted keyboard responses' field='acceptedKeys'>
          <InputTag
            labelInValue
            tokenSeparators={[' ']}
            validate={v => v.length === 1}
            allowClear
            saveOnBlur
          />
        </Item>

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

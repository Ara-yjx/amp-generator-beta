
import { Button, Collapse, Form, InputNumber, type FormInstance } from '@arco-design/web-react';
import throttle from 'lodash/throttle';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpParams } from '../data/ampTypes';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { generateBlob, generateQsfString } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { AcceptedKeys } from './acceptedKeys';
import { AutoProceedTimeout } from './autoProceedTimeout';
import { StimuliPool } from './stimuliPool';
import { Timeline } from './timeline';
import { TrialHtml } from './trialHtml';
import { WarnTrialNumber } from './warnTrialNumber';
import { LoadSave } from './loadSave';
import { MultiRounds } from './multiRounds';

const { Item } = Form;


const DownloadButton: React.FC<{ values?: AmpParams }> = ({ values }) => {
  const [url, setUrl] = useState<string>();
  const blobUrl = useBlobUrl();
  const throttledSetBlob = useRef<(values?: AmpParams) => void>();
  if (!throttledSetBlob.current) {
    throttledSetBlob.current = throttle((values?: AmpParams) => {
      if (values) {
        setUrl(blobUrl(generateBlob(generateQsfString(values))))
      }
    }, 500, { leading: true, trailing: true });
  }
  useEffect(() => throttledSetBlob.current?.(values), [values]);
  return (
    <Button type='primary' href={url} download='spt-generator.qsf'>
      Generate Qualtrics qsf File
    </Button>
  );
};


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
        <LoadSave />
        <h3 style={{ textAlign: 'left' }}>Stimuli List</h3>
        <StimuliPool />
        <br />

        <h3 style={{ textAlign: 'left' }}>Trial Timeline</h3>

        <Item field='timeline'>
          <Timeline />
        </Item>

        <span style={{ textAlign: 'left' }}>
          <Item label='Number of total trials' field='totalTrials' >
            <InputNumber min={0} style={{ width: 160 }} suffix='trials' />
          </Item>
          <Item shouldUpdate noStyle>
            {values => <WarnTrialNumber values={values} />}
          </Item>
          <MultiRounds />
          <Item
            label='Accepted keyboard responses' field='acceptedKeys'
            extra='Letters (a~z, case insensitive), Number digits (0~9), Arrow keys, Space key.'
          >
            <AcceptedKeys />
          </Item>
          <Item field='timeline.autoProceedTimeout'>
            <AutoProceedTimeout />
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
              <DownloadButton values={values} />
            )
          }
        </Item>
      </Form >
    </>
  )
};

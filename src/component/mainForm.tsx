import { Collapse, Form, InputNumber, type FormInstance, Tooltip, Space, Radio } from '@arco-design/web-react';
import throttle from 'lodash/throttle';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpParams } from '../data/ampTypes';
import { emptyAmpParams } from '../data/emptyAmpParams';
import { generateBlob, generateQsfString } from '../data/generate';
import { PrimeValidation, getPrimeValidation, initialPrimeValidation } from '../data/primeValidation';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { PrimeValidationContext } from './PrimeValidationContext';
import { AcceptedKeys } from './acceptedKeys';
import { AutoProceedTimeout } from './autoProceedTimeout';
import { BubblyButton } from './bubblyButton';
import { LoadSave } from './loadSave';
import { MultiRounds } from './multiRounds';
import { StimuliPool } from './stimuliPool';
import { Timeline } from './timeline';
import { TrialHtml } from './trialHtml';
import { WarnTotalTrials } from './warnTotalTrials';
import { IconCloudDownload, IconQuestionCircle } from '@arco-design/web-react/icon';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { AdvancedTimeline } from './advancedTimeline';

const { Item } = Form;
const RadioGroup = Radio.Group;

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
    <BubblyButton href={url} download='spt-generator.qsf'>
      <Space>
        <IconCloudDownload style={{ fontSize: '1.5em' }} />
        Generate Qualtrics qsf File
      </Space>
    </BubblyButton>
  );
};


export const MainForm: React.FC<{}> = ({ }) => {

  console.log('MainForm')
  const formRef = useRef<FormInstance<AmpParams>>(null);

  const [primeValidation, setPrimeValidation] = useState<PrimeValidation | null>(null);

  const onValuesChange = (changeValue: Partial<AmpParams>, values: Partial<AmpParams>) => {
    console.log('onValuesChange: ', changeValue, values);
    if (values.stimuli && values.totalRounds) {
      setPrimeValidation(getPrimeValidation(values.stimuli, values.totalRounds));
    }
  };

  return (
    <PrimeValidationContext.Provider value={primeValidation}>
      <Form
        layout='vertical'
        ref={formRef}
        initialValues={emptyAmpParams}
        onValuesChange={onValuesChange}
      >
        <LoadSave />
        <h3 style={{ textAlign: 'left' }}>Stimuli Pool</h3>
        <StimuliPool />
        <br />

        <h3 style={{ textAlign: 'left' }}>Trial Flow</h3>

        <Item field='trialType' style={{ textAlign: 'left' }}>
          <RadioGroup type='button' options={[{ value: 'simple', label: 'Simple' }, { value: 'advanced', label: 'Advanced' }]} />
        </Item>

        <Item shouldUpdate>{
          values => values.trialType === 'simple' ? (
            <Item field='timeline'>
              <Timeline />
            </Item>
          ) : (
            <AdvancedTimeline />
          )
        }</Item>

        <span style={{ textAlign: 'left' }}>
          <Item label='Number of total trials' field='totalTrials' >
            <InputNumber min={0} style={{ width: 160 }} suffix='trials' />
          </Item>
          <Item shouldUpdate noStyle>
            {values => <WarnTotalTrials values={values} />}
          </Item>
          <MultiRounds />
        </span>

        <Collapse bordered={false} style={{ marginBottom: 20 }}>
          <Collapse.Item name='0' header={<h3>Trial Block HTML</h3>}>
            <TrialHtml />
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
    </PrimeValidationContext.Provider>
  )
};

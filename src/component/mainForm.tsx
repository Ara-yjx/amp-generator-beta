import { Collapse, Form, Input, InputNumber, type FormInstance, Tooltip, Space, Radio, Divider } from '@arco-design/web-react';
import throttle from 'lodash/throttle';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpParams } from '../data/ampTypes';
import { emptyAmpParams } from '../data/emptyAmpParams';
import { generateBlob, generateQsfString } from '../data/generate';
import { PrimeValidation, getPrimeValidation, initialPrimeValidation } from '../data/primeValidation';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { PrimeValidationContext } from './PrimeValidationContext';
import { BubblyButton } from './bubblyButton';
import { LoadSave } from './loadSave';
import { MultiRounds } from './multiRounds';
import { StimuliPool } from './stimuliPool';
import { Timeline } from './timeline';
import { TrialHtml } from './trialHtml';
import { WarnTotalTrials } from './warnTotalTrials';
import { IconCloudDownload, IconQuestionCircle } from '@arco-design/web-react/icon';
import { AdvancedTimeline } from './advancedTimeline';
import { Debugger } from './debugger';

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
  const [formValues, setFormValues] = useState<Partial<AmpParams>>();

  const onValuesChange = (changeValue: Partial<AmpParams>, values: Partial<AmpParams>) => {
    console.log('onValuesChange: ', changeValue, values);
    if (values.stimuli && values.totalRounds) {
      setPrimeValidation(getPrimeValidation(values.stimuli, values.totalRounds));
    }
    setFormValues(values);
  };

  return (
    <PrimeValidationContext.Provider value={primeValidation}>
      <Form
        layout='vertical'
        ref={formRef}
        initialValues={emptyAmpParams}
        onValuesChange={onValuesChange}
      >
        {window.location.hostname === 'localhost' && <Debugger />}
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
          <Item label={
            <Space>
              Survey Identifier (for Reference Survey)
              <Tooltip content={<p>
                When using qualtrics "Reference Survey" to include another survey into this survey, you need to distinguish the Embedded Data of two surveys so that they don't mix up.<br />
                To do so, you can add different "Survey Identifier" for each survey. The Embedded Data will have Survey Identifier as suffix.<br />
                For example, if the Survey Identifier is set to "111", Embedded Data "stimuliItems" will become "stimuliItems:111" instead.<br />
                <Divider />
                If you need to run additional trial after finishing the referenced survey,
                you need to manually add a Embedded Data block in Qualtrics Survey Flow that sets "sptSurveyIdentifier" to <i>the identifier of your main survey</i> before the trial block.
              </p>
              }>
                <IconQuestionCircle />
              </Tooltip>
            </Space>
          } field='surveyIdentifier'>
            <Input style={{ width: 160 }} />
          </Item>
        </span>

        <Collapse bordered={false} style={{ marginBottom: 20 }}>
          <Collapse.Item name='0' header={<h3>Trial Block HTML</h3>}>
            <TrialHtml />
          </Collapse.Item>
        </Collapse>

        {/* <Item shouldUpdate>
          {
            values => (
              <DownloadButton values={values} />
            )
          }
        </Item> */}
        <DownloadButton values={formValues as AmpParams} />
      </Form >
    </PrimeValidationContext.Provider>
  )
};

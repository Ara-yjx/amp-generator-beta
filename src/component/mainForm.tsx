import { Collapse, Form, Input, InputNumber, type FormInstance, Tooltip, Space, Radio, Divider, Spin, Message } from '@arco-design/web-react';
import throttle from 'lodash/throttle';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpParams } from '../data/ampTypes';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { emptyAmpParams } from '../data/emptyAmpParams';
import { generateBlob, generateQsfString } from '../data/generate';
import { PrimeValidation, getPrimeValidation, initialPrimeValidation } from '../data/primeValidation';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { PrimeValidationContext } from './PrimeValidationContext';
import { BubblyButton } from './bubblyButton';
import { LoadSave } from './loadSave';
import { CloudSyncProvider, useCloudSync } from '../context/CloudSyncContext';
import { MultiRounds } from './multiRounds';
import { StimuliPool } from './stimuliPool';
import { Timeline } from './timeline';
import { TrialHtml } from './trialHtml';
import { WarnTotalTrials } from './warnTotalTrials';
import { IconCloudDownload, IconQuestionCircle } from '@arco-design/web-react/icon';
import { AdvancedTimeline } from './advancedTimeline';
import { Debugger } from './debugger';
import { MixedPools } from './mixedPools';
import { SelectedOutput } from './selectedOutput';
import { useParams } from 'react-router';
import { oneDebouncerUnitTest } from '../data/cloudSync';

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
  const { expId } = useParams();
  const formRef = useRef<FormInstance<AmpParams>>(null);

  const [primeValidation, setPrimeValidation] = useState<PrimeValidation | null>(null);
  const [formValues, setFormValues] = useState<Partial<AmpParams>>();

  // Parse experiment ID from string to number
  const parseExpId = (expId: string | undefined): number | null => {
    if (!expId) return null;
    const id = Number(expId);
    return isNaN(id) ? null : id;
  };

  const experimentId: number | null = parseExpId(expId);

  const onValuesChange = (changeValue: Partial<AmpParams>, values: Partial<AmpParams>) => {
    if (values.stimuli && values.totalRounds) {
      setPrimeValidation(getPrimeValidation(values.stimuli, values.totalRounds));
    }
    setFormValues(values);
  };

  useEffect(() => {
    window.onbeforeunload = () => 'Leaving the page will reset all settings. Have you saved your settings?';
    return () => { window.onbeforeunload = null; };
  }, []);

  return (
    <PrimeValidationContext.Provider value={primeValidation}>
      <CloudSyncProvider>
        <MainFormContent
          formRef={formRef}
          onValuesChange={onValuesChange}
          formValues={formValues}
          experimentId={experimentId}
        />
      </CloudSyncProvider>
    </PrimeValidationContext.Provider>
  );
};

const MainFormContent: React.FC<{
  formRef: React.RefObject<FormInstance<AmpParams>>;
  onValuesChange: (changeValue: Partial<AmpParams>, values: Partial<AmpParams>) => void;
  formValues: Partial<AmpParams> | undefined;
  experimentId: number | null;
}> = ({ formRef, onValuesChange, formValues, experimentId }) => {
  const { syncState, save, initializeExperiment } = useCloudSync();

  // Initialize experiment and load from cloud
  useEffect(() => {
    if (experimentId && formRef.current) {
      initializeExperiment(experimentId)
        .then((parsed) => {
          // If undefined, initialization was skipped (already in progress or complete)
          if (parsed === undefined) {
            return;
          }
          
          if (parsed?.values) {
            formRef.current?.resetFields();
            formRef.current?.setFieldsValue(parsed.values);
            Message.success('Loaded settings from cloud');
          } else {
            Message.warning('The cloud data appears to be empty. Initializing with default settings.');
            formRef.current?.resetFields();
            formRef.current?.setFieldsValue(defaultAmpParams);
          }
        })
        .catch((e: any) => {
          console.error('Load error:', e);
          // Check if it's a transform error
          if (e.message?.includes('transform')) {
            Message.error(`Error transforming old settings format: ${e.message}. The experiment is now opened in Read-Only mode.`);
            formRef.current?.setFieldValue('editorBrokenMode', true);
          } else {
            Message.error(`Failed to load settings: ${e.message}. Please try refreshing the page.`);
          }
        });
    }
  }, [experimentId, initializeExperiment, formRef]);

  // Auto-save whenever form values change
  useEffect(() => {
    if (formValues) {
      // Pass raw values object, CloudSyncContext will handle stringification
      save(formValues);
    }
  }, [formValues, save]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <Spin loading={syncState === 'initial-loading'} size={80}>
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

          <MixedPools />
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
          
          <SelectedOutput />

          {/* <Item shouldUpdate>
              {
                values => (
                  <DownloadButton values={values} />
                )
              }
            </Item> */}
          <DownloadButton values={formValues as AmpParams} />
        </Form >
      </Spin>
    </div>
  )
};

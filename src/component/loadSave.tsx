
import { Button, Form, FormInstance, Link, Message, Modal, Space, Tooltip, Typography } from '@arco-design/web-react';
import { IconDesktop, IconDownload, IconPaste, IconQuestionCircle, IconUpload } from '@arco-design/web-react/icon';
import React, { useEffect, useRef } from 'react';
import { useHref, useNavigate, useParams } from 'react-router';
import { ExperimentData } from '../data/apiTypes';
import { getExperiment, updateExperimentData } from '../data/backend';
import { transformOldValues, transformValuesOnSave } from '../data/backwardCompatibility';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { generateBlob } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { useMyBatchDebounce } from '../hooks/useMyBatchDebounce';

const { Item } = Form;
const { Text } = Typography;

// Arco form renders Form Item twice but displays the result of first render
// As a result, the invoked blobUrl is used.
// So, we cannot put useBlobUrl in the parent component <DownloadUpload/>.
// We must put it inside Item component <DownloadSettingsButton/> to make sure it goes with the component lifecycle.
const SaveSettingsButton: React.FC<{ values?: any }> = (values) => {
  const blobUrl = useBlobUrl();
  return (
    <Button type='outline' icon={<><IconDownload /><IconDesktop /></>}
      href={blobUrl(generateBlob(JSON.stringify(transformValuesOnSave(values))))}
      download='spt-generator-settings.json'
    >
      Save
    </Button>
  )
}


const AutoSave = ({ lastSavedTime, updateLastSavedTime, experimentId }: { lastSavedTime: string | null, updateLastSavedTime: (time: string) => void, experimentId: number | null }) => {
  // Don't know why `getFieldsValue` has error that gets the old value without 'editorBrokenMode'. But useWatch and Item with shouldUpdate works.
  const { form } = Form.useFormContext();
  const editorBrokenModeWatch = Form.useWatch('editorBrokenMode', form);

  const saveToCloudDebounced = useMyBatchDebounce((values: any) => {
    console.debug('useMyBatchDebounce', { editorBrokenModeWatch, experimentId, values });
    if (editorBrokenModeWatch) {
      console.debug('Auto-save skipped due to no experimentId or BROKEN_MODE');
    } else if (experimentId) {
      saveToCloud(experimentId, values, lastSavedTime).then((newSavedTime) => {
        if (newSavedTime) {
          updateLastSavedTime(newSavedTime);
        }
      });
    }
  }, 5000);

  return (
    <Item shouldUpdate noStyle>
      {
        values => {
          saveToCloudDebounced(values);
          return null;
        }
      }
    </Item>
  );
}

export const LoadSave = () => {

  const { form } = Form.useFormContext();
  const { expId } = useParams();
  const navigate = useNavigate();

  // Parse experiment ID from string to number
  const parseExpId = (expId: string | undefined): number | null => {
    if (!expId) return null;
    const id = Number(expId);
    if (isNaN(id)) {
      Message.error('The experiment ID in URL is invalid. Will redirect to My page in 3 seconds.');
      setTimeout(() => navigate('/my'), 3000);
      return null;
    };
    return id;
  }

  const experimentId: number | null = parseExpId(expId);
  const lastSavedVersionRef = useRef<{ data?: { time: string } }>({});

  const myPageHref = useHref('/my');

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // file selector aborted
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string | undefined;
        if (content) {
          const values = JSON.parse(content).values;
          transformOldValues(values);
          form.setFieldsValue(values);
          lastSavedVersionRef.current.data = undefined;
          Message.success('Loaded successfully. 🎉');
        } else {
          throw 'Cannot read file content';
        }
      } catch (e: any) {
        Message.error(`Load failed. ${e.message}`);
      }
    };
    reader.readAsText(file);
  };

  const loadSettingsInputRef = useRef<HTMLInputElement>(null);

  const useExampleSettings = () => {
    if (window.confirm('⚠️⚠️⚠️ This will overwrite all settings. Continue?')) {
      form.resetFields();
      form.setFieldsValue(defaultAmpParams);
      lastSavedVersionRef.current.data = undefined;
    }
  };

  // load experiment once from cloud
  useEffect(() => {
    experimentId && loadFromCloud(experimentId, form);
    lastSavedVersionRef.current.data = undefined;
  }, [experimentId]);

  const isBrokenModeWatch = Form.useWatch('editorBrokenMode', form);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <input
        type='file'
        style={{ display: 'none' }}
        ref={loadSettingsInputRef}
        onChange={onFileInputChange}
      />
      <Space>
        <Button type='outline' icon={<><IconUpload /><IconDesktop /></>} onClick={() => loadSettingsInputRef.current?.click()}>
          Load
        </Button>
        <Item shouldUpdate noStyle>
          {values => <SaveSettingsButton values={values} />}
        </Item>
        <Button type='outline' icon={<IconPaste />} onClick={useExampleSettings}>
          Use Example Settings
        </Button>
      </Space>
      {
        expId ? (
          isBrokenModeWatch ? (
            <Text type='error'>Read-Only Mode</Text>
          ) : null
        ) : (
          <Space size='mini'>
            <Text type='secondary'>Guest Mode</Text>
            <Tooltip content={
              <p>
                You can only load and save your STIMULIZE settings to local files.<br /> To sync your settings to cloud, login and create a project through&nbsp;
                <Link icon href={myPageHref} target='_blank' style={{ color: 'white', textDecoration: 'underline' }} hoverable={false}>My page</Link>.
              </p>
            }>
              <IconQuestionCircle />
            </Tooltip>
          </Space>
        )
      }
      <AutoSave
        lastSavedTime={lastSavedVersionRef.current.data?.time ?? null}
        updateLastSavedTime={(time) => lastSavedVersionRef.current.data = { time }}
        experimentId={experimentId}
      />
    </div>
  )
};



// Load, transformOldValues, apply to form
async function loadFromCloud(experimentId: number, form: FormInstance): Promise<void> {

  const { experiment } = await getExperiment(experimentId);
  const experimentData = experiment.experimentData as ExperimentData | undefined;
  if (experimentData?.settings) {
    try {
      const settings = JSON.parse(experimentData.settings);
      console.log('Loaded settings from cloud:', settings);
      if (!settings.values) {
        Message.warning('The cloud data appears to be empty. Initializing with default settings.');
        form.resetFields();
        form.setFieldsValue(defaultAmpParams);
        return;
      }
      try {
        // TODO: maybe add a confirmation here? version code?
        transformOldValues(settings.values);
        console.log('Transformed settings:', settings);
      } catch (e: any) {
        console.warn('transformOldValues error:', e);
        Message.error(`Error transforming old settings format: ${e.message}. The experiment is now opened in Read-Only mode, and there might be errors. Please manually copy the settings to a new experiment.`);
        settings.values.editorBrokenMode = true;
        console.warn(JSON.stringify(settings.values, null, 2));
      }
      form.resetFields();
      form.setFieldsValue(settings.values);
      Message.success('Loaded settings from cloud');
    } catch (e: any) {
      Message.error(`Failed to load settings: ${e.message}. Please try refreshing the page.`);
    }
  }
}

async function saveToCloud(experimentId: number, values: any, lastSavedTime: string | null): Promise<string | undefined> {

  // check if experiment has been updated elsewhere
  const { experiment } = await getExperiment(experimentId);
  const cloudTimestamp = experiment.lastUpdatedAt;
  const localTimestamp = lastSavedTime;
  // if (true) {
  if (cloudTimestamp && localTimestamp && cloudTimestamp !== localTimestamp) {
    Modal.confirm({
      title: 'Version Conflict',
      content: (<Text>
        This experiment has been updated elsewhere since your last save. Overwrite the remote version with your local changes?
        <ul>
          <li>Remote version: {cloudTimestamp ?? 'N/A'}.</li>
          <li>Local version: {localTimestamp ?? 'N/A'}.</li>
        </ul>
        Please do not edit one experiment from multiple devices or browser tabs simultaneously.
      </Text>),
      onOk: continueSave,
      okText: 'Overwrite Remote',
      cancelText: 'Cancel Save',
    });
  } else {
    return await continueSave();
  }

  async function continueSave() {
    const { experiment } = await updateExperimentData(experimentId, {
      experimentData: {
        settings: JSON.stringify(transformValuesOnSave({ values })),
      }
    });
    console.debug('Auto-saved to cloud:', experiment);
    return experiment.lastUpdatedAt;
  }
}

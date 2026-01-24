
import { Button, Form, Link, Message, Space, Tooltip, Typography } from '@arco-design/web-react';
import { IconCheckCircle, IconCloud, IconDesktop, IconDownload, IconPaste, IconQuestionCircle, IconSync, IconUpload } from '@arco-design/web-react/icon';
import React, { useRef } from 'react';
import { useHref, useParams } from 'react-router';
import { transformValuesOnSave } from '../data/backwardCompatibility';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { generateBlob } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { useCloudSync } from '../context/CloudSyncContext';
import { transformOldValues } from '../data/backwardCompatibility';

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


const AutoSave = () => {
  const { syncState } = useCloudSync();

  const renderStatus = () => {
    switch (syncState) {
      case 'initial-loading':
        return <span>Loading... <IconSync /></span>;
      case 'saving':
        return <span>Auto-saving... <IconSync /></span>;
      case 'saved':
        return <span>Saved <IconCheckCircle /></span>;
      case 'error':
        return <span style={{ color: 'var(--color-danger-light-4)' }}>Save failed, retrying...</span>;
    }
  };

  return (
    <Text type='secondary'>
      <IconCloud />
      {renderStatus()}
    </Text>
  );
}


export const LoadSave = () => {

  const { form } = Form.useFormContext();
  const { expId } = useParams();
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
          Message.success('Loaded successfully. 🎉');
        } else {
          throw new Error('Cannot read file content');
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
    }
  };

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
      <AutoSave />
    </div>
  )
};

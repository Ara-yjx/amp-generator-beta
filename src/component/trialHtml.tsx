import React, { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Form, Input, InputNumber, Popover, Radio, Select, Space, Typography } from '@arco-design/web-react';
import type { AmpParams, AmpStimuliItem, AmpTrialHtml } from '../data/ampTypes';
import { renderTrialHtml } from '../data/renderTrialHtml';
import type { ArcoFormItem } from '../util/arco';
import { StimuliThumbnail } from './stimuliThumbnail';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconRefresh, IconToBottom, IconToLeft, IconToRight, IconToTop } from '@arco-design/web-react/icon';
import { CompactPicker } from 'react-color';

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;

// const QUALTRICS_DEFAULT_SKIN = {
//   fontSize: '24',
//   fontWeight: '400',
//   fontFamily: 'Poppins,Arial,sans-serif',
//   color: '#757575',
//   lineHeight: '1.5em',
// } as const; // as Partial<CSSStyleDeclaration>;
const QUALTRICS_STYLE = `
# @font-face {
#   font-family: Poppins;
#   src: url(/fonts/poppinslight.ttf);
#   font-style: normal;
#   font-weight: 400
# }
# @font-face {
#   font-family: Poppins;
#   src: url(/fonts/poppinslight.ttf);
#   font-style: italic;
#   font-weight: 400
# }
body {
  font-size: 24px;
  font-weight: 400px;
  font-family: Poppins,Arial,sans-serif;
  color: #757575;
  line-height: 1.5em;
}
`;


const setIframeContent = (
  previewRef: React.MutableRefObject<HTMLIFrameElement | null>,
  previewInnerHtml: string,
  previewStimuliItem: AmpStimuliItem | undefined,
) => {
  const iframeDocument = previewRef.current?.contentDocument;
  if (iframeDocument) {
    // Set style once 
    if (!iframeDocument.getElementById('preview-style')) {
      const styleEl = iframeDocument.createElement('style');
      styleEl.id = 'preview-style';
      styleEl.appendChild(iframeDocument.createTextNode(QUALTRICS_STYLE));
      iframeDocument.head.appendChild(styleEl);
    }
    // Set body html
    iframeDocument.body.innerHTML = previewInnerHtml;
    // Simulate stimuli preview
    const imageEl = iframeDocument.getElementById('spt-trial-image') as HTMLImageElement;
    const textEl = iframeDocument.getElementById('spt-trial-text') as HTMLElement;
    if (imageEl && textEl && previewStimuliItem) {
      imageEl.style.visibility = '';
      textEl.style.visibility = '';
      if (previewStimuliItem.type === 'image') {
        imageEl.src = previewStimuliItem.content;
        textEl.style.visibility = 'hidden';
      } else if (previewStimuliItem.type === 'text') {
        textEl.innerText = previewStimuliItem.content;
        imageEl.style.visibility = 'hidden';
      }
    }
    // Border for visibility
    if (textEl.parentElement) {
      textEl.parentElement.style.border = '1px solid grey';
    }
  }
}


const TextColorPicker: React.FC<ArcoFormItem<AmpTrialHtml['textColor']>> = ({ value, onChange }) => (
  <Space size='mini'>
    <Text type='secondary'>Font color</Text>
    <Popover
      trigger='click'
      position='right'
      content={
        <Space direction='vertical'>
          <CompactPicker color={value ?? '#000'} onChange={v => onChange?.(v.hex)} />
          <Button size='mini' type='secondary' icon={<IconRefresh />} onClick={() => onChange?.(undefined)}>
            Use default color of your Qualtrics skin
          </Button>
        </Space>
      }
    >
      {
        value === undefined ?
          <Button size='mini' type='secondary'>(default)</Button> :
          <Button size='mini' style={{ backgroundColor: value, boxShadow: 'grey 0 0 2px' }}></Button>
      }
    </Popover>
  </Space>
);


const ConfigModeForm: React.FC = () => {
  return (
    <div>
      <Space size='large'>
        <Item field='trialHtml.width' label={
          <b>Content Width <IconToLeft /><IconToRight /></b>
        } style={{ width: 200 }}>
          <InputNumber suffix='px' />
        </Item>
        <Item field='trialHtml.height' label={
          <b>Content Height <IconToLeft style={{ transform: 'rotate(90deg)', transformOrigin: 'right' }} /><IconToRight style={{ transform: 'rotate(90deg)', transformOrigin: 'left' }} /></b>
        } style={{ width: 200 }}>
          <InputNumber suffix='px' />
        </Item>
      </Space>

      <Item field='trialHtml.marginTop' label={<b>Blank space above content</b>} layout='vertical' style={{ width: 200 }}>
        <InputNumber suffix='px' />
      </Item>

      <Item label={<b>Text stimuli style</b>} layout='vertical'>
        <Space size={50} style={{ width: '100%' }} >
          <Space size='mini'>
            <Text type='secondary'>Font size</Text>
            <Item field='trialHtml.textFontSize' noStyle layout='inline'>
              <InputNumber suffix='px' min={1} style={{ width: 100 }} />
            </Item>
          </Space>
          <Item field='trialHtml.textIsBold' noStyle triggerPropName='checked'>
            <Checkbox><Text type='secondary'>Bold</Text></Checkbox>
          </Item>
          <Item field='trialHtml.textColor' noStyle>
            <TextColorPicker />
          </Item>
          <Item field='trialHtml.textWrap' noStyle triggerPropName='checked'>
            <Checkbox><Text type='secondary'>Wrap text</Text></Checkbox>
          </Item>
        </Space>
      </Item>

      <Item field='trialHtml.instruction' label={<b>Instruction Text</b>} layout='vertical'>
        <Input.TextArea style={{ minHeight: '6em' }} />
      </Item>
    </div>
  );
};


const CustomModeForm: React.FC = () => (
  <Item field='trialHtml.customHtml' noStyle>
    <Input.TextArea
      style={{ minHeight: '15em', fontFamily: 'Inconsolata, Consolas, monospace' }}
    />
  </Item>
);


export const TrialHtml: React.FC = () => {

  const { form } = useFormContext();
  const trialHtmlWatch = useWatch('trialHtml', form) as AmpParams['trialHtml'];
  const isConfigMode = typeof trialHtmlWatch.customHtml !== 'string';

  // When switch to custom mode, render from current configs.
  // When switch to config mode, clear customHtml after confirmation.
  const onModeChange = (isNewModeConfigMode: boolean) => {
    if (isNewModeConfigMode) {
      if (trialHtmlWatch.customHtml !== renderTrialHtml(trialHtmlWatch)) {
        if (!window.confirm('Switching to Use Configurations will revert all the edits in Customized HTML. Continue?')) {
          return;
        }
      }
      form.setFieldValue('trialHtml.customHtml', undefined);
    } else {
      form.setFieldValue('trialHtml.customHtml', renderTrialHtml(trialHtmlWatch));
    }
  }

  // Preview

  const [previewStimuliItemUid, setPreviewStimuliItemUid] = useState<number>();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const allItems = stimuliWatch.flatMap((stimuli, stimuliIndex) => (
    stimuli.items.map((item, itemIndex) => ({ ...item, indexDisplay: `${stimuliIndex + 1}-${itemIndex + 1}` }))
  ));
  const previewStimuliItem = allItems.find(item => item.uid === previewStimuliItemUid);

  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewInnerHtml = trialHtmlWatch.customHtml ?? renderTrialHtml(trialHtmlWatch);

  useEffect(() => {
    setIframeContent(previewRef, previewInnerHtml, previewStimuliItem)
  }, [previewRef, previewInnerHtml, previewStimuliItem?.content, previewStimuliItem?.type]);

  // If stimuli updates and the previewStimuliItem is deleted, reset previewStimuliItem
  useEffect(() => {
    if (!allItems.find(x => x.uid === previewStimuliItemUid)) {
      setPreviewStimuliItemUid(undefined);
    }
  });

  return (
    <div style={{ textAlign: 'start' }}>
      <div>
        <Radio.Group
          type='button'
          value={isConfigMode}
          onChange={onModeChange}
          options={[
            { value: true, label: 'Use Configurations' },
            { value: false, label: 'Customize HTML' },
          ]}
          style={{ marginBottom: '12px' }}
        />
      </div>

      {isConfigMode ? <ConfigModeForm /> : <CustomModeForm />}

      <div style={{ display: 'flex', flexDirection: 'column' }} >
        <Space size='large'>
          <h3>Preview</h3>
          <Select
            placeholder='Select a stimuli item to preview'
            style={{ width: 300, height: 32 }}
            value={previewStimuliItemUid}
            onChange={setPreviewStimuliItemUid}
            allowClear
          >
            {
              allItems.map((item) => (
                <Option key={item.uid} value={item.uid}>
                  <StimuliThumbnail {...item} />
                </Option>
              ))
            }
          </Select>
        </Space>
        <iframe style={{ flexGrow: 1 }} ref={previewRef} height={700}></iframe>
        <Text type='secondary'>(The grey border of content area will not be visible in the generated survey.)</Text>
      </div >
    </div>
  )
};

import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, InputNumber, Radio, Select, Space, Typography } from '@arco-design/web-react';
import type { AmpParams, AmpStimuliItem, AmpTrialHtml, AmpTrialHtmlParams } from '../data/ampTypes';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { renderTrialHtml } from '../data/renderTrialHtml';
import type { ArcoFormItem } from '../util/arco';
import { StimuliThumbnail } from './stimuliThumbnail';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import throttle from 'lodash/throttle';
import { IconToBottom, IconToLeft, IconToRight, IconToTop } from '@arco-design/web-react/icon';

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;

const defaultParams = defaultAmpParams.trialHtml as AmpTrialHtmlParams;
const defaultHtml = renderTrialHtml(defaultParams);

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


const setIframeContent = throttle((
  previewRef: React.MutableRefObject<HTMLIFrameElement | null>,
  previewInnerHtml: string,
  previewStimuliItem: AmpStimuliItem | undefined,
  isUsingParams: boolean,
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
    if (isUsingParams) {
      if (textEl.parentElement) {
        textEl.parentElement.style.border = '1px solid grey';
      }
    }
  }
}, 500, { leading: true, trailing: true });


export const TrialHtml: React.FC<ArcoFormItem<AmpTrialHtml>> = ({ value, onChange }) => {


  const [isUsingParams, setIsUsingParams] = useState<boolean>(typeof value === 'object');
  const [params, setParams] = useState<AmpTrialHtmlParams>(
    typeof value === 'object' ? value : defaultParams
  );
  const [bulk, setBulk] = useState<string>(
    typeof value === 'string' ? value : defaultHtml
  );

  const onParamsFormChange = (change: Partial<AmpTrialHtmlParams>, values: Partial<AmpTrialHtmlParams>) => {
    const newParams = { ...params, ...values };
    setParams(newParams);
    onChange?.(newParams);
  };

  const onBulkChange = (value: string) => {
    setBulk(value);
    onChange?.(value);
  };


  // Preview

  const [previewStimuliUid, setPreviewStimuliItemUid] = useState<number>();
  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const allItems = stimuliWatch.flatMap((stimuli, stimuliIndex) => (
    stimuli.items.map((item, itemIndex) => ({ ...item, indexDisplay: `${stimuliIndex + 1}-${itemIndex + 1}` }))
  ));
  const previewStimuliItem = allItems.find(item => item.uid === previewStimuliUid);

  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewInnerHtml = isUsingParams ? renderTrialHtml(params) : bulk;

  useEffect(() => setIframeContent(previewRef, previewInnerHtml, previewStimuliItem, isUsingParams));

  const paramsComponent = (
    <Form
      initialValues={params}
      onValuesChange={onParamsFormChange}
      layout='vertical'
    >
      <Space size='large'>
        <Item field='width' label={
          <>Image Width <IconToLeft /><IconToRight /></>
        } style={{ width: 200 }}>
          <InputNumber suffix='px' />
        </Item>
        <Item field='height' label={
          <>Image Height <IconToLeft style={{ transform: 'rotate(90deg)', transformOrigin: 'right' }} /><IconToRight style={{ transform: 'rotate(90deg)', transformOrigin: 'left' }} /></>
        } style={{ width: 200 }}>
          <InputNumber suffix='px' />
        </Item>
      </Space>
      <Item field='marginTop' label='Blank space at page top' layout='vertical' style={{ width: 200 }}>
        <InputNumber suffix='px' />
      </Item>
      <Item field='text' label='Instruction Text' layout='vertical'>
        <Input.TextArea style={{ minHeight: '6em' }} />
      </Item>
    </Form>
  );


  const htmlComponent = (
    <Input.TextArea
      style={{ minHeight: '8em', fontFamily: 'Inconsolata, Consolas, monospace' }}
      value={bulk}
      onChange={onBulkChange}
    />
  );

  return (
    <>
      <div style={{ textAlign: 'left' }}>
        <Radio.Group
          type='button'
          value={isUsingParams}
          onChange={setIsUsingParams}
          options={[
            { value: true, label: 'Using Parameters' },
            { value: false, label: 'Customize HTML' },
          ]}
          style={{ marginBottom: '12px' }}
        />
      </div>

      {isUsingParams ? paramsComponent : htmlComponent}
      {/* 
      <Tabs defaultActiveTab={isUsingParams ? 'params' : 'html'}>
        <TabPane key='params' title='Using Parameters'> 
        </TabPane>
        <TabPane key='html' title='Customize HTML'>
        </TabPane>
      </Tabs> 
      */}

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'start' }} >
        <Space size='large'>
          <h3>Preview</h3>
          <Item shouldUpdate noStyle>
            {
              (value: AmpParams) => {

                return (
                  <Select
                    placeholder='Select a stimuli item to preview'
                    style={{ width: 300, height: 32 }}
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
                )
              }
            }
          </Item>
        </Space>
        <iframe style={{ flexGrow: 1 }} ref={previewRef} height={700}></iframe>
        {
          isUsingParams && (
            <Text type='secondary'>(Black image border will not be visible in the generated survey.)</Text>
          )
        }
      </div >
    </>
  )
};



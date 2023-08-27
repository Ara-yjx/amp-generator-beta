import { Form, Input, InputNumber, Radio } from '@arco-design/web-react';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpTrialHtml, AmpTrialHtmlParams } from '../data/ampTypes';
import { defaultAmpParams } from '../data/defaultAmpParams';
import { renderTrialHtml } from '../data/renderTrialHtml';
import type { ArcoFormItem } from '../util/arco';

const { Item } = Form;

const initialParams = defaultAmpParams.trialHtml as AmpTrialHtmlParams;
const initialHtml = renderTrialHtml(initialParams);

export const TrialHtml: React.FC<ArcoFormItem<AmpTrialHtml>> = ({ value, onChange }) => {

  const [isUsingParams, setIsUsingParams] = useState<boolean>(typeof value === 'object');
  const [params, setParams] = useState<AmpTrialHtmlParams>(
    typeof value === 'object' ? value : initialParams
  );
  const [bulk, setBulk] = useState<string>(
    typeof value === 'string' ? value : initialHtml
  );

  // const { TabPane } = Tabs;

  const onParamsFormChange = (change: Partial<AmpTrialHtmlParams>, values: Partial<AmpTrialHtmlParams>) => {
    const newParams = { ...params, ...values };
    setParams(newParams);
    onChange?.(newParams);
  };

  const onBulkChange = (value: string) => {
    setBulk(value);
    onChange?.(value);
  };


  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const previewInnerHtml = isUsingParams ? renderTrialHtml(params) : bulk;
  useEffect(() => {
    const iframeDocument = previewRef.current?.contentDocument;
    if (iframeDocument) {
      iframeDocument.body.innerHTML = previewInnerHtml;
    }
  }, [[previewInnerHtml]]);

  const radioOptions = [
    { value: true, label: 'Using Parameters' },
    { value: false, label: 'Customize HTML' },
  ];


  const paramsComponent = (
    <Form
      initialValues={params}
      onValuesChange={onParamsFormChange}
      layout='vertical'
    >
      <Item field='width' label='Image Width' style={{width: 200}}>
        <InputNumber suffix='px' />
      </Item>
      <Item field='height' label='Image Height' style={{width: 200}}>
        <InputNumber suffix='px' />
      </Item>
      <Item field='text' label='Text' layout='vertical'>
        <Input.TextArea style={{ minHeight: '6em' }} />
      </Item>
    </Form>
  );

  const htmlComponent = (
    <Input.TextArea style={{ minHeight: '8em' }} value={bulk} onChange={onBulkChange} />
  );

  return (
    <>
      <div style={{ textAlign: 'left' }}>
        <Radio.Group
          type='button'
          value={isUsingParams}
          onChange={setIsUsingParams}
          options={radioOptions}
          style={{ marginBottom: '12px' }}
        />
      </div>

      {
        isUsingParams ? paramsComponent : htmlComponent
      }
      {/* 
      <Tabs defaultActiveTab={isUsingParams ? 'params' : 'html'}>
        <TabPane key='params' title='Using Parameters'> 
        </TabPane>
        <TabPane key='html' title='Customize HTML'>
        </TabPane>
      </Tabs> 
      */}

      <div style={{ height: 600, display: 'flex', flexDirection: 'column' }} >
        <h3>Preview</h3>
        <iframe style={{ flexGrow: 1 }} ref={previewRef}></iframe>
      </div>
    </>
  )
};



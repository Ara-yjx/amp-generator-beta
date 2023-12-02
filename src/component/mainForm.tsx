
import React, { useRef, useEffect, useState } from 'react';
import { Form, Input, Button, Checkbox, InputNumber, InputTag, type FormInstance, Tabs, Switch, Card, Collapse } from '@arco-design/web-react';
import { defaultAmpParams } from '../data/defaultAmpParams';
import type { AmpParams, AmpStimuli } from '../data/ampTypes';
import { generateBlob, generateQsfString } from '../data/generate';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Timeline } from './timeline';
import { StimuliImage } from './stimuliImage';
import { TrialHtml } from './trialHtml';
import { WarnTrialNumber } from './warnTrialNumber';
import { AcceptedKeys } from './acceptedKeys';
import { AutoProceedTimeout } from './autoProceedTimeout';
import throttle from 'lodash/throttle';
import { uid } from '../data/uid';

const { Item } = Form;
const { TabPane } = Tabs;


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

  const [activeStimuliTab, setActiveStimuliTab] = useState(0);
  const newStimuli: AmpStimuli = {
    items: [{ type: 'text', content: '', count: 1, uid: uid() }],
    shuffle: false, isEnablePriming: false, prime: []
  };

  return (
    <>
      <Form
        layout='vertical'
        ref={formRef}
        initialValues={defaultAmpParams}
        onValuesChange={onValuesChange}
      >
        <Item label={<h3>Stimuli List</h3>}>
          <Form.List field='stimuli' >
            {
              (fields, { add, remove }) => (
                <Tabs
                  activeTab={`${activeStimuliTab}`}
                  onChange={tabKeyStr => setActiveStimuliTab(parseInt(tabKeyStr))}
                  type='card-gutter'
                  editable
                  onAddTab={() => { add({ ...newStimuli }); setActiveStimuliTab(fields.length); }}
                  onDeleteTab={tabKeyStr => {
                    const tabKey = parseInt(tabKeyStr);
                    if (window.confirm(`⚠️⚠️⚠️ Are you sure to delete Stimuli ${tabKey + 1} and all its primings completely?`)) {
                      remove(tabKey);
                      if (fields.length === 1) { // keep at least one tab
                        add({ ...newStimuli });
                      } else if (tabKey === fields.length - 1) { // if remove last tab, focus on prev tab
                        setActiveStimuliTab(tabKey - 1);
                      }
                    }
                  }}
                >
                  {
                    fields.map(({ field }, index) => (
                      <TabPane key={index} title={`Stimuli ${index + 1}`} style={{ padding: 15 }}>
                        <StimuliImage field={field} />
                      </TabPane>
                    ))
                  }
                </Tabs>
              )
            }
          </Form.List>
        </Item>

        <Item label={<h3>Trial timeline</h3>} field='timeline'>
          <Timeline />
        </Item>

        <span style={{ textAlign: 'left' }}>
          <Item label='Number of total trials' field='totalTrials' >
            <InputNumber min={0} style={{ width: 200 }} />
          </Item>
          <Item shouldUpdate noStyle>
            {values => <WarnTrialNumber values={values} />}
          </Item>
          <Item
            label='Number of total rounds' field='totalRounds'
            extra='To create the second-round trial block in Qualtrics, click the "Copy" button on the top-right of the "Run trial" block to replicate.'
          >
            <InputNumber min={1} style={{ width: 200 }} />
          </Item>
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
}

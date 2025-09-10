import { Checkbox, Form, InputNumber, Space, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconSkipNext } from '@arco-design/web-react/icon';
import React, { useEffect } from 'react';
import type { AT } from '../data/ampTypes';
import { AcceptedKeys } from './acceptedKeys';

const { Item } = Form;
const { Text } = Typography;

/** 
 * field: advancedTimeline.pages[*] 
 * field type: AT.Page
 */
export const ATPageResponseConfig: React.FC<{ field: string }> = ({ field }) => {
  const { form } = useFormContext();
  const keyboardResponseEnabledWatch = useWatch(`${field}.response.keyboard.enabled`, form);

  // When mouseClick disabled, disable mouseTracking too
  const mouseClickEnabledWatch = useWatch(`${field}.response.mouseClick.enabled`, form) as AT.Page['response']['mouseClick'];
  const mouseTrackingWatch = useWatch(`${field}.mouseTracking`, form) as AT.Page['mouseTracking'];
  useEffect(() => {
    if (!mouseClickEnabledWatch && mouseTrackingWatch) {
      form.setFieldValue(`${field}.mouseTracking`, undefined);
    }
  }, [mouseClickEnabledWatch, mouseTrackingWatch]);

  return (
    <>
      <Space style={{ margin: '10px 0', width: '100%' }}>
        <IconSkipNext />
        <Text bold>Go to next page when</Text>
      </Space>

      <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
        <Item field={`${field}.response.timeout.enabled`} triggerPropName='checked' layout='inline'>
          <Checkbox>
            <div style={{ display: 'inline-block', width: '10em' }}>After fixed duration</div>
          </Checkbox>
        </Item>
        <Item field={`${field}.response.timeout.duration`} layout='inline' >
          <InputNumber suffix='ms' min={0} style={{ width: 100, minWidth: 60 }} />
        </Item>
      </Space>

      {/* TODO: Space should only wrap 'keys' and 'delayBefore' input, fix all item paddings  */}
      <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
        <Item field={`${field}.response.keyboard.enabled`} triggerPropName='checked' layout='inline'>
          <Checkbox>
            <div style={{ display: 'inline-block', width: '10em' }}>Keyboard response</div>
          </Checkbox>
        </Item>
        {
          keyboardResponseEnabledWatch && <>
            <Item field={`${field}.response.keyboard.keys`} label='Accepted keys' layout='inline' >
              <AcceptedKeys />
            </Item>
            <Item field={`${field}.response.keyboard.delayBefore`} label='Delay before accepting keyboard' layout='inline' >
              <InputNumber suffix='ms' min={0} style={{ width: 100, minWidth: 60 }} />
            </Item>
          </>
        }
      </Space>

      <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
        <Item field={`${field}.response.mouseClick.enabled`} triggerPropName='checked' layout='inline'>
          <Checkbox>
            <div style={{ display: 'inline-block' }}>Mouse click response</div>
          </Checkbox>
        </Item>
        <Item field={`${field}.mouseTracking`} triggerPropName='checked' layout='inline'>
          <Checkbox disabled={!mouseClickEnabledWatch}>
            <div style={{ display: 'inline-block' }}>Record mouse tracking</div>
          </Checkbox>
        </Item>
      </Space>
    </>
  )
}


export default ATPageResponseConfig;

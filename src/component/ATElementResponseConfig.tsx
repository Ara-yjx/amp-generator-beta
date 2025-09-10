import React, { useEffect } from "react";

import { Checkbox, Form, Space, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import type { AT } from '../data/ampTypes';
import { AcceptedKeys } from './acceptedKeys';

const { Item } = Form;
const { Text } = Typography;

export interface ATElementResponseConfigProps {
  field: string,
  pageIndex: number,
}

/** 
 * field type: LayoutedDisplayItem
 * field: advancedTimeline.pages[*].layoutedDisplays[row][col] 
 *     or advancedTimeline.pages[*].freeformDisplays.elements..<ElementDisplayItem>..displayItem
 */
export const ATElementResponseConfig: React.FC<ATElementResponseConfigProps> = ({ field, pageIndex }) => {
  const { form } = useFormContext();
  const mouseClickEnabledWatch = useWatch(`advancedTimeline.pages[${pageIndex}].response.mouseClick.enabled`, form) as boolean;
  const keyboardClickEnabledWatch = useWatch(`advancedTimeline.pages[${pageIndex}].response.keyboard.enabled`, form) as boolean;
  const swapWatch = useWatch(`advancedTimeline.pages[${pageIndex}].swap`, form) as AT.Page['swap'];
  
  // When mouseClick turned off, turn off mouseClickAccuratePoint too
  const mouseClickWatch = useWatch(`${field}.mouseClick`, form);
  const mouseClickAccuratePointWatch = useWatch(`${field}.mouseClickAccuratePoint`, form);
  useEffect(() => {
    if (!mouseClickWatch && mouseClickAccuratePointWatch) {
      form.setFieldValue(`${field}.mouseClickAccuratePoint`, undefined);
    }
  }, [mouseClickWatch, mouseClickAccuratePointWatch]);

  return (
    <Space direction='vertical'>
      {
        swapWatch && (
          <Item field={`${field}.swap`} triggerPropName='checked' noStyle>
            <Checkbox>Swappable</Checkbox>
          </Item>
        )
      }
      {
        swapWatch && keyboardClickEnabledWatch && (
          <Space>
            <Text>Bind keys</Text>
            <Item field={`${field}.bindKeyboard`} noStyle>
              <AcceptedKeys maxTagCount={2}/>
            </Item>
          </Space>
        )
      }
      {
        mouseClickEnabledWatch && (
          <Space direction='vertical'>
            <Item field={`${field}.mouseClick`} triggerPropName='checked' noStyle>
              <Checkbox>Clickable</Checkbox>
            </Item>
            <Item field={`${field}.mouseClickAccuratePoint`} triggerPropName='checked' noStyle>
              <Checkbox><Text type='secondary'>add accurate point</Text></Checkbox>
            </Item>
          </Space>
        )
      }
    </Space>
  )
};

export default ATElementResponseConfig;

import React, { useEffect } from 'react';

import { Checkbox, Form, Space, Typography } from '@arco-design/web-react';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import type { AT } from '../data/ampTypes';
import { AcceptedKeys } from './acceptedKeys';
import { ArcoFormItem } from '../util/arco';

const { Item } = Form;
const { Text } = Typography;

export interface ATElementResponseConfigProps extends ArcoFormItem<AT.ResponsiveDisplayItem> {
  pageIndex: number,
}

/** 
 * field type: LayoutedDisplayItem
 * field: advancedTimeline.pages[*].layoutedDisplays[row][col] 
 *     or advancedTimeline.pages[*].freeformDisplays.elements..<ElementDisplayItem>..displayItem
 * 
 * This form item is friendly and will not touch other fields in the value.
 * It watches page response settings.
 */
export const ATElementResponseConfig: React.FC<ATElementResponseConfigProps> = ({ value, onChange, pageIndex }) => {
  const { form } = Form.useFormContext();
  const mouseClickEnabledWatch = useWatch(`advancedTimeline.pages[${pageIndex}].response.mouseClick.enabled`, form) as boolean;
  const keyboardClickEnabledWatch = useWatch(`advancedTimeline.pages[${pageIndex}].response.keyboard.enabled`, form) as boolean;
  const swapWatch = useWatch(`advancedTimeline.pages[${pageIndex}].swap`, form) as AT.Page['swap'];

  const shouldShowBindKeys = swapWatch && keyboardClickEnabledWatch && value?.swap;
  useEffect(() => {
    if (!shouldShowBindKeys && value?.bindKeyboard && value.bindKeyboard.length > 0) {
      onChange?.({ ...value, bindKeyboard: [] });
    }
  }, [shouldShowBindKeys]);

  if (!value) return null;

  return (
    <Space direction='vertical'>
      {
        swapWatch && (
          <Item noStyle>
            <Checkbox checked={value.swap} onChange={checked => onChange?.({ ...value, swap: checked })}>
              Swappable
            </Checkbox>
          </Item>
        )
      }
      {
        shouldShowBindKeys && (
          <Space>
            <Text>Bind keys</Text>
            <Item noStyle>
              <AcceptedKeys value={value.bindKeyboard} onChange={v => onChange?.({ ...value, bindKeyboard: v })} maxTagCount={2} />
            </Item>
          </Space>
        )
      }
      {
        mouseClickEnabledWatch && (
          <div>
            <div>
            <Item noStyle>
              <Checkbox
                checked={value.mouseClick}
                // also disable mouseClickAccuratePoint
                onChange={v => onChange?.(v ? { ...value, mouseClick: v } : { ...value, mouseClick: v, mouseClickAccuratePoint: undefined })}
              >
                Clickable
              </Checkbox>
            </Item>
            </div>
            <div>
            <Item noStyle>
              <Checkbox checked={value.mouseClickAccuratePoint} onChange={v => onChange?.({ ...value, mouseClickAccuratePoint: v })}>
                <Text type='secondary'>add accurate point</Text>
              </Checkbox>
            </Item>
            </div>
          </div>
        )
      }
      {!swapWatch && !shouldShowBindKeys && !mouseClickEnabledWatch && (
        <Text type='secondary'>Keyboard or Mouse Click response not enabled.</Text>
      )}
    </Space>
  )
};

export default ATElementResponseConfig;

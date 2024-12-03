import { Button, Popover, Space, Typography } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import React from 'react';
import { CompactPicker } from 'react-color';
import type { AmpTrialHtml } from '../data/ampTypes';
import type { ArcoFormItem } from '../util/arco';

const { Text } = Typography;

interface TextColorPickerProps {
  showLabel?: boolean,
  showUseDefaultButton?: boolean;
}

export const TextColorPicker: React.FC<ArcoFormItem<AmpTrialHtml['textColor']> & TextColorPickerProps> = ({ value, onChange, showLabel = true, showUseDefaultButton = true, disabled }) => (
  <Space size='mini'>
    {showLabel && <Text type='secondary'>Font color </Text>}
    <Popover
      trigger='click'
      position='right'
      disabled={disabled}
      content={
        <Space direction='vertical'>
          <CompactPicker color={value ?? '#000'} onChange={v => onChange?.(v.hex)} />
          {
            showUseDefaultButton && (
              <Button size='mini' type='secondary' icon={<IconRefresh />} onClick={() => onChange?.(undefined)}>
                Use default color of your Qualtrics skin
              </Button>
            )
          }
        </Space>
      }
    >
      {
        value === undefined ?
          <Button size='mini' type='secondary' disabled={disabled}>(default)</Button> :
          <Button size='mini' disabled={disabled} style={{ backgroundColor: value, boxShadow: 'grey 0 0 2px' }}></Button>
      }
    </Popover>
  </Space>
);

import { Button, Popover, Space } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import React from 'react';
import { CompactPicker } from 'react-color';
import type { AmpTrialHtml } from '../data/ampTypes';
import type { ArcoFormItem } from '../util/arco';

interface TextColorPickerProps {
  showUseDefaultButton?: boolean;
  colors?: string[];
}

export const TextColorPicker: React.FC<ArcoFormItem<AmpTrialHtml['textColor']> & TextColorPickerProps> = ({
  value,
  onChange,
  disabled,
  showUseDefaultButton = true,
  colors,
}) => (
  <Popover
    trigger='click'
    position='right'
    disabled={disabled}
    content={
      <Space direction='vertical'>
        <CompactPicker color={value ?? '#000'} onChange={v => onChange?.(v.hex)} colors={colors} />
        {
          showUseDefaultButton && (
            <Button size='mini' type='secondary' icon={<IconRefresh />} onClick={() => onChange?.(undefined)}>
              Use default color
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
);

import { InputNumber, Space, Switch, Typography } from '@arco-design/web-react';
import React from 'react';
import type { AmpTimeline } from '../data/ampTypes';
import type { ArcoFormItem } from '../util/arco';


export const AutoProceedTimeout: React.FC<ArcoFormItem<AmpTimeline['autoProceedTimeout']>> = ({ value, onChange }) => {

  return (
    <Space>
      <Switch checked={value !== null} onChange={value => onChange?.(value ? 0 : null)}/>
      <Typography.Text type='secondary'>Auto proceed to next trial after timeout</Typography.Text>
      <InputNumber 
        suffix='ms' 
        min={0} 
        value={value ?? undefined} 
        disabled={value === null} 
        onChange={onChange}
        style={{ width: 100 }}
      />
    </Space>
  )
}
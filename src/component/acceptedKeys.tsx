import { InputTag } from '@arco-design/web-react';
import React from 'react';
import { AmpParams } from '../data/ampTypes';
import type { ArcoFormItem } from '../util/arco';

function allowedKeys(key: string) {
  if (key.length === 1) {
    if (key >= '0' && key <= '9') return key;
    if (key >= 'a' && key <= 'z') return key;
    if (key === ' ') return 'Space';
    if (key >= 'A' && key <= 'Z') return key.toLowerCase();
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    return key;
  }
  return false;
}

export const AcceptedKeys: React.FC<ArcoFormItem<AmpParams['acceptedKeys']>> = ({ value, onChange }) => {

  const onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newKey = allowedKeys(e.key);
    if (newKey !== false) {
      const keys = [...(new Set([...value ?? [], newKey]))];
      onChange?.(keys);
    }
  }

  return (
    <InputTag
      value={value}
      onChange={onChange}
      inputValue={''}
      allowClear
      onKeyDown={onKeyDown}
    />
  )
};

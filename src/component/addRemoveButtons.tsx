import { Button, Space, type SpaceProps } from '@arco-design/web-react';
import { IconMinus, IconPlus } from '@arco-design/web-react/icon';
import React from 'react';




export const AddRemoveButtons: React.FC<{
  onAdd?: ((e: Event) => void);
  onRemove?: ((e: Event) => void);
  disableRemove?: boolean;
  style?: React.CSSProperties;
  spaceSize?: SpaceProps['size'];
  spaceWrap?: boolean;
}> = ({ onAdd, onRemove, disableRemove, style, spaceSize, spaceWrap }) => (

  <Space style={style} size={spaceSize} wrap={spaceWrap}>
    <Button shape='circle' type='outline' icon={<IconPlus />} onClick={onAdd} />
    <Button shape='circle' type='outline' icon={<IconMinus />} onClick={onRemove} disabled={disableRemove} />
  </Space>
)

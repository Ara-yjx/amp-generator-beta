import { Space, Typography } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { AT } from '../data/ampTypes';

const { Title, Text } = Typography;

export const FreeformElementInternal: React.FC<{ value: AT.FreeformLayout.ElementDisplayItem }> = ({
  value,
}) => (
  // If use single element to fit parent and host children, would cause flicker in rendering,
  // because the layouting of internal text and has some effect on the parent
  // So we decouple it into a div to fit parent and a Space to host children, creating a new BFC
  useMemo(() => (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '0 20px',
      border: '1px solid #A38408',
      backgroundColor: '#FEFFE8', // Arco yellow-1
      boxSizing: 'border-box',
    }}>
      <Space direction='vertical'>
        <Title heading={6}>{value.name ?? ' '}</Title>
        <Text>{printDisplaySrc(value.displayItem.displaySrc)}</Text>
        <Text>{value.boxStyle.width} x {value.boxStyle.height}</Text>
      </Space>
    </div>
  ), [value.name, value.displayItem.displaySrc, value.boxStyle.width, value.boxStyle.height])
);


export function printDisplaySrc(displaySrc: AT.DisplaySrc): string {
  switch (displaySrc[0]) {
    case 'pool':
      return `Pool ${displaySrc[1].map(i => i + 1)}`;
    case 'copy':
      return `Copy ${displaySrc[1]} ${displaySrc[2]} ${displaySrc[3]}`;
    case 'blank':
      return '(blank)';
    default:
      return '';
  }
}

export default FreeformElementInternal;

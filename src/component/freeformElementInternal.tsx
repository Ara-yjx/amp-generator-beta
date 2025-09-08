import { Layout, Typography } from '@arco-design/web-react';
import React from 'react';
import { AT } from '../data/ampTypes';

const { Title, Text } = Typography;

export const FreeformElementInternal: React.FC<{ value: AT.FreeformLayout.ElementDisplayItem }> = ({
  value,
}) => (
  <Layout style={{ padding: '0 10px' }}>
    <Title heading={6}>{value.name ?? ' '}</Title>
    <Text>{printDisplaySrc(value.displayItem.displaySrc)}</Text>
    <Text>{value.boxStyle.width} x {value.boxStyle.height}</Text>
  </Layout>
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

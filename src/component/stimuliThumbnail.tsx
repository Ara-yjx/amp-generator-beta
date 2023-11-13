import React, { ReactNode } from 'react';
import { AmpStimuliItem } from '../data/ampTypes';
import { Typography } from '@arco-design/web-react';
const { Text } = Typography;

export interface StimuliThumbnailProps {
  indexDisplay: ReactNode,
  type: AmpStimuliItem['type'],
  content: string,
}

export const StimuliThumbnail: React.FC<StimuliThumbnailProps> = ({ indexDisplay, type, content }) => (

  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{ minWidth: 32 }}>
      {indexDisplay}
    </div>
    {
      type === 'image' ?
        <img src={content} style={{ width: 32, height: 32 }} />
        :
        <Text ellipsis style={{ marginBottom: 0, marginLeft: 4 }}>{content}</Text>
    }
  </div>
);

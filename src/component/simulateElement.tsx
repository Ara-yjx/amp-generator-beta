import React from 'react';
import type { AmpStimuliItem, AmpStimuliStyle, AmpTrialHtml } from '../data/ampTypes';
import { IconCamera } from '@arco-design/web-react/icon';

export interface SimulateElementProps {
  type: AmpStimuliItem['type'] | 'blank';
  content?: string;
  mouseClickAccuratePoint: boolean;
  stimuliStyle?: AmpStimuliStyle;
  trialHtml?: AmpTrialHtml; // customHtml must be disabled
}

export const SimulateElement: React.FC<SimulateElementProps> = ({
  type,
  content,
  mouseClickAccuratePoint,
  stimuliStyle,
  trialHtml
}) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: trialHtml?.textColor ?? 'auto',
  };

  const accuratePoint = mouseClickAccuratePoint ? (
    <div
      style={{
        position: 'absolute',
        bottom: -30,
        width: 15,
        height: 15,
        border: '1px solid #000',
        borderRadius: '50%',
        backgroundColor: '#f3f3f3',
        cursor: 'pointer',
      }}
    />
  ) : null;

  let inner = null;
  switch (type) {
    case 'image':
      inner = (
        <img
          src={content}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />
      );
      break;
    case 'text':
      inner = (
        <div
          style={{
            width: '100%',
            height: '100%',
            whiteSpace: trialHtml?.textWrap ? 'pre-line' : 'pre',
            overflowWrap: 'break-word',
            color: stimuliStyle?.color ?? trialHtml?.textColor ?? 'auto',
            fontWeight: trialHtml?.textIsBold ? 'bold' : 'normal',
            fontSize: stimuliStyle?.fontSize ?? trialHtml?.textFontSize ?? 20,
            lineHeight: '1.5em',
            textAlign: stimuliStyle?.textAlign as React.CSSProperties['textAlign'] | undefined,
            cursor: 'default', // avoid "text" cursor; only in simulate, not in qualtrics trial
          }}
        >
          {content}
        </div>
      );
      break;
    case 'video':
      inner = (
        <video
          src={content}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          preload="auto"
          autoPlay
          loop={stimuliStyle?.loop}
          muted={stimuliStyle?.muted}
          playsInline
        />
      );
      break;
    case 'button':
      inner = (
        <button
          style={{
            maxWidth: '100%',
            whiteSpace: 'pre-line',
            overflowWrap: 'break-word',
            color: '#000',
            fontSize: stimuliStyle?.fontSize ?? 20,
            lineHeight: '1.2em',
            border: '1px solid #000',
            borderRadius: 4,
            backgroundColor: '#f3f3f3',
            padding: `${stimuliStyle?.buttonPaddingTopBottom ?? 0}px ${stimuliStyle?.buttonPaddingLeftRight ?? 4}px`,
            cursor: 'pointer',
          }}
        >
          {content}
        </button>
      );
      break;
    case 'camera':
      inner = <IconCamera />;
      break;
  }

  return (
    <div style={containerStyle}>
      {inner}
      {accuratePoint}
    </div>
  );
};



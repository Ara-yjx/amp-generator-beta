import React from 'react';
import { AmpParams, AT } from '../data/ampTypes';
import { SimulateElement, SimulateElementProps } from './simulateElement';
import { Form } from '@arco-design/web-react';


export const FreeformElementPreviewInternal: React.FC<{ value: AT.FreeformLayout.ElementDisplayItem }> = ({
  value,
}) => {
  const { form } = Form.useFormContext();
  const displayItem = value.displayItem;
  const stimuliWatch = form.getFieldValue('stimuli') as AmpParams['stimuli'] | undefined;
  const trialHtmlWatch = form.getFieldValue('trialHtml') as AmpParams['trialHtml'] | undefined;

  const simulateElementProps: SimulateElementProps = {
    type: 'blank',
    content: '',
    mouseClickAccuratePoint: !!displayItem.mouseClickAccuratePoint,
    trialHtml: trialHtmlWatch,
  };

  if (value.previewStimuliItemRef && Array.isArray(stimuliWatch)) {
    const { poolIndex, itemIndex } = value.previewStimuliItemRef;
    const pool = stimuliWatch[poolIndex];
    if (pool && Array.isArray(pool.items)) {
      const item = pool.items[itemIndex];
      if (item) {
        simulateElementProps.type = item.type;
        simulateElementProps.content = item.content;
        simulateElementProps.stimuliStyle = item.style;
      }
    }
  }

  return <SimulateElement {...simulateElementProps} />;
};

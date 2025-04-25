import { cloneDeep } from 'lodash';
import React from 'react';
import type { AmpStimuli } from '../data/ampTypes';
import { uid } from '../data/uid';
import { DraggableTabs } from './DraggableTabs';
import { StimuliImage } from './stimuliImage';

const newStimuli: AmpStimuli = {
  items: [{ type: 'text', content: '', count: 1, uid: uid() }],
  shuffle: false, isEnablePriming: false, prime: []
};

export const StimuliPool: React.FC = () => {

  return (
    <DraggableTabs
      field='stimuli'
      renderTab={StimuliImage}
      renderTitle={({ index }) => (<>Stimuli Pool {index + 1}</>)}
      provideNewTab={() => (cloneDeep(newStimuli))}
      warningOnDelete={tabKey => `⚠️⚠️⚠️ Are you sure to delete Stimuli Pool ${tabKey + 1} and all its primings completely?`}
    />
  );

};

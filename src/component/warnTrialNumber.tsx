import React from 'react';
import { AmpParams } from '../data/ampTypes';
import { Typography } from '@arco-design/web-react';
import sumBy from 'lodash/sumBy';

export const WarnTrialNumber: React.FC<{ values: AmpParams }> = ({ values }) => {

  const stimuliImageCounts = values.stimuli.map((stimuli, stimuliIndex) => (
    [
      stimuliIndex,
      sumBy(stimuli.items, i => i.count),
    ]
  ));
  console.log('stimuliImageCounts', stimuliImageCounts)

  const mismatchStimuli = stimuliImageCounts.filter(([stimuliIndex, count]) => count !== values.totalTrials)

  if (!mismatchStimuli.length) return null;
  return (
    <div style={{ transform: 'translateY(-16px)' }}>
      <Typography.Text type='warning'>
        {'The number of trials does match the total image count of stimuli '}
        {mismatchStimuli.map(([stimuliIndex]) => stimuliIndex + 1).join(',')}
        .<br />
        {
          mismatchStimuli.map(([stimuliIndex, count]) => (
            <span key={stimuliIndex}>- Total image count of simuli {stimuliIndex + 1}: {count} <br/></span>
          ))
        }
      </Typography.Text>

    </div>
  )
}
/** @deprecated */


import { Alert } from '@arco-design/web-react';
import React, { useContext } from 'react';
import { AmpParams } from '../data/ampTypes';
import { PrimeValidationContext } from './PrimeValidationContext';

export const WarnTrialNumber: React.FC<{ values: AmpParams }> = ({ values }) => {

  const primeValidation = useContext(PrimeValidationContext);
  if (!primeValidation) {
    return null;
  }

  const { possibleTotalItems } = primeValidation;
  const { totalTrials, totalRounds } = values;
  const invalidPoolRounds = possibleTotalItems.flatMap((poolPossibleTotals, poolIndex) => {
    return poolPossibleTotals.flatMap((possibleTotals, roundIndex) => (
      possibleTotals[0] < totalTrials ? {
        poolIndex, roundIndex, possibleTotals,
      } : []
    ))
  });

  return (
    <div style={{ transform: 'translateY(-16px)' }}>
      {
        invalidPoolRounds.map(({ poolIndex, roundIndex, possibleTotals }) => (
          <Alert type='warning' content={
            <>
              {`The Number of Total Trials is larger than the`}
              {possibleTotals.length > 1 && ` Minimum`}
              {` Total Items Count of stimuli ${poolIndex + 1}`}
              {totalRounds > 1 && ` round ${roundIndex + 1}`}
              {`, which is `}
              <b>{possibleTotals[0]}</b>
            </>
          } />
        ))
      }
    </div>
  )
}

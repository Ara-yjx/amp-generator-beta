import type { AmpParams, AmpStimuli, AmpStimuliPrimeItem } from './ampTypes';
import qsfTemplate from '../assets/qsfTemplate.json';
import { renderTrialHtml } from './renderTrialHtml';
import { findPrimeRepresentationFromUid } from '../util/util';

interface EmbeddedDataTemplate {
  Description: string;
  Field: string;
  Type: string;
  Value?: string;
}
export function hydrateQsf(params: AmpParams) {
  const template = qsfTemplate;
  /* @ts-ignore */
  const embeddedData = template.SurveyElements[1].Payload.Flow[0].EmbeddedData as EmbeddedDataTemplate[];
  function setEd(name: string, value: any) {
    const ed = embeddedData.find(ed => ed.Field === name);
    if (ed) {
      if (value === null) {
        ed.Type = 'Recipient';
        ed.Value = undefined; // Value field will be removed when stringify. That's how Qualtrics represents empty value.
      } else if (typeof value === 'object') {
        ed.Value = JSON.stringify(value);
      } else {
        ed.Value = `${value}`; // (undefined, true, false...) are parsed to strings
      }
    }
  }

  const stimuliItems = [{
    pools: params.stimuli.map(({ items, shuffle }) => ({
      items: items.map(({ type, content, count }) => ({ type, content, count })),
      shuffle: shuffle,
    })),
    totalTrials: params.totalTrials,
  }];
  setEd('stimuliItems', stimuliItems);
  setEd('totalRounds', params.totalRounds);
  setEd('timeline', {
    durationsAndIntervals: [[params.timeline[0], params.timeline[1]], [params.timeline[2], params.timeline[3]]],
    delayBeforeKeyboard: params.timeline[4],
    delayAfterKeyboard: params.timeline[5],
    autoProceedTimeout: params.autoProceedTimeout,
  });
  setEd('primes', exportPrime(params));
  console.log('exportPrime', exportPrime(params))
  setEd('acceptedKeys', params.acceptedKeys.join(','));


  const trialSurveyElement = template.SurveyElements.find(e => e.Element === 'SQ')
  if (trialSurveyElement) {
    const trialHtml = typeof params.trialHtml === 'object' ? renderTrialHtml(params.trialHtml) : params.trialHtml;
    // @ts-ignore
    trialSurveyElement.Payload.QuestionText = trialHtml;
  }

  return template;
}

export function generateQsfString(params: AmpParams) {
  const hydrated = hydrateQsf(params);
  console.log('hydrated', hydrated)
  return JSON.stringify(hydrated);
}

export function generateBlob(str: string) {
  return new Blob([str], { type: 'text/plain' });
}

function exportPrime(params: AmpParams) {
  const primes = params.stimuli.flatMap((stimuli, poolIndex) => (
    stimuli.prime.map(primeItem => ({ ...primeItem, stimuli, poolIndex, roundIndex: 0 }))
  ))
  return primes.map(({ uid, name, includeUids, excludeUids, overrideCount, stimuli, poolIndex }) => {
    const include = includeUids.map(
      uid => findPrimeRepresentationFromUid(uid, stimuli)
    ).filter(x => x !== undefined);
    const exclude = excludeUids?.map(
      uid => findPrimeRepresentationFromUid(uid, stimuli)
    ).filter(x => x !== undefined);
    return {
      name: `prime_stimuli_${poolIndex + 1}_${name}`,
      pool: poolIndex + 1,
      include: include?.length ? include : undefined,
      exclude: exclude?.length ? exclude : undefined,
      overrideCount: overrideCount,
    }
  });
}

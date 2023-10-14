import type { AmpParams, AmpStimuli } from './ampTypes';
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
      } else {
        ed.Value = `${value}`; // (undefined, true, false...) are parsed to strings
      }
    }
  }

  params.stimuli.map((stimuli, index) => {
    setEd(`stimuli_${index + 1}_items`, JSON.stringify(stimuli.items));
    setEd(`stimuli_${index + 1}_shuffle`, stimuli.shuffle);
    setEd(`stimuli_${index + 1}_prime`, exportPrime(stimuli));
  });
  setEd('stimuli_1_duration', params.timeline[0]);
  setEd('stimuli_1_interval', params.timeline[1]);
  setEd('stimuli_2_duration', params.timeline[2]);
  setEd('stimuli_2_interval', params.timeline[3]);
  setEd('delay_before_keyboard', params.timeline[4]);
  setEd('delay_after_keyboard', params.timeline[5]);
  setEd('accepted_keys', params.acceptedKeys.join(','));
  setEd('total_trials', params.totalTrials);
  setEd('auto_proceed_timeout', params.autoProceedTimeout);

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

function exportPrime(stimuli: AmpStimuli) {
  const { prime, isEnablePriming } = stimuli;
  if (!isEnablePriming) {
    return null;
  }
  return JSON.stringify(
    prime.map(p => {
      const include = p.includeUids?.map(
        uid => findPrimeRepresentationFromUid(uid, stimuli)
      ).filter(
        x => x !== undefined
      );
      const exclude = p.excludeUids?.map(
        uid => findPrimeRepresentationFromUid(uid, stimuli)
      ).filter(
        x => x !== undefined
      );
      return {
        name: p.name,
        include: include?.length ? include : undefined,
        exclude: exclude?.length ? exclude : undefined,
        override_count: p.isEnableOverrideCount ? p.overrideCount : undefined,
      };
    })
  );
}

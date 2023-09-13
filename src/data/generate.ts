import type { AmpParams, AmpStimuli } from './ampTypes';
import qsfTemplate from '../assets/qsfTemplate.json';
import { renderTrialHtml } from './renderTrialHtml';

interface EmbeddedDataTemplate {
  Description: string;
  Field: string;
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
        ed.Value = undefined; // Value field will be removed when stringify. That's how Qualtrics represents empty value.
      } else {
        ed.Value = `${value}`; // (undefined, true, false...) are parsed to strings
      }
    }
  }

  params.stimuli.map((stimuli, index) => {
    setEd(`stimuli_${index + 1}_items`, JSON.stringify(stimuli.items));
    setEd(`stimuli_${index + 1}_shuffle`, stimuli.shuffle);
    setEd(`stimuli_${index + 1}_prime`, JSON.stringify(exportPrime(stimuli)));
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
  const { items, prime } = stimuli;
  return Object.fromEntries(prime.map(p => {
    const static_item = p.itemType === 'static' ? (
      items.findIndex(({ uid }) => uid === p.staticItemUid) + 1
    ) : undefined;
    const random_item_exclude = p.itemType === 'randomExclude' ? (
      p.randomItemExcludeUid?.map(excludedUid => prime.find(({ uid }) => excludedUid === uid)?.name).filter(x => x !== undefined)
    ) : undefined;
    const override_count = p.isEnableOverrideCount ? p.overrideCount : undefined;
    const entry = [
      p.name,
      {
        static_item,
        random_item_exclude,
        override_count,
      }
    ];
    return entry;
  }));
}

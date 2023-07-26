import type { AmpParams } from './ampTypes';
import qsfTemplate from '../assets/qsfTemplate.json';

interface EmbeddedDataTemplate {
  Description: string;
  Field: string;
  Value: string;
}
export function hydrateQsf(params: AmpParams) {
  const template = qsfTemplate;
  /* @ts-ignore */
  const embeddedData = template.SurveyElements[1].Payload.Flow[0].EmbeddedData as EmbeddedDataTemplate[];
  function setEd(name: string, value: any) {
    const ed = embeddedData.find(ed => ed.Field === name);
    if (ed) {
      ed.Value = `${value}`;
    }
  }
  params.stimuli.map((stimuli, index) => {
    setEd(`stimuli_${index + 1}_items`, JSON.stringify(stimuli.items));
    setEd(`stimuli_${index + 1}_shuffle`, stimuli.shuffle);
    setEd(`stimuli_${index + 1}_shuffle_max_repeat`, null);
    // setEd(`stimuli_${index + 1}_shuffle_max_repeat`, stimuli.shuffleMaxRepeat);
  });
  setEd('stimuli_1_duration', params.timeline[0]);
  setEd('stimuli_1_interval', params.timeline[1]);
  setEd('stimuli_2_duration', params.timeline[2]);
  setEd('stimuli_2_interval', params.timeline[3]);
  setEd('keyboard_delay', params.timeline[4]);
  setEd('accepted_keys', params.acceptedKeys.join(','));
  setEd('total_trials', params.totalTrials);

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
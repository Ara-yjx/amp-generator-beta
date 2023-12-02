export interface AmpStimuliItem {
  uid: number;
  type: 'image' | 'text';
  content: string;
  count: number;
}

export type AmpStimuliPrimeItem = {
  uid: number;
  name: string;
  includeUids: number[];
  excludeUids: number[];
  overrideCount: (number|undefined) | (number|undefined)[] | null; // same InputNumber might set value to undefined
};

export interface AmpStimuli {
  items: AmpStimuliItem[];
  shuffle: boolean | number;
  isEnablePriming: boolean;
  prime: AmpStimuliPrimeItem[];
}

export interface AmpTrialHtmlParams {
  width: number;
  height: number;
  marginTop: number;
  text: string;
}
export type AmpTrialHtml = AmpTrialHtmlParams | string;

export interface AmpParams {
  stimuli: AmpStimuli[];
  timeline: number[];
  acceptedKeys: string[];
  totalTrials: number;
  totalRounds: number;
  autoProceedTimeout: number | null;
  delayBeforeKeyboard: number;
  delayAfterKeyboard: number;
  trialHtml: AmpTrialHtml;
}

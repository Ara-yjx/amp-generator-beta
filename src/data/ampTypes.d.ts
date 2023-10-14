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
  isEnableOverrideCount: boolean;
  overrideCount?: number;
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
  text: string;
}
export type AmpTrialHtml = AmpTrialHtmlParams | string;

export interface AmpParams {
  stimuli: [AmpStimuli, AmpStimuli, AmpStimuli];
  timeline: [number, number, number, number, number, number];
  acceptedKeys: string[];
  totalTrials: number;
  autoProceedTimeout: number | null;
  trialHtml: AmpTrialHtml;
}

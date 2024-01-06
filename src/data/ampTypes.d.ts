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
  // undefined means no-override, null means selection box is explicit no-override
  overrideCount: (number|undefined) | (number|undefined)[] | null; 
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
  instruction: string;
  textFontSize: number;
  textIsBold: boolean;
  textColor?: string;
  /** @deprecated */
  text?: string; // use instruction
}
export type AmpTrialHtml = AmpTrialHtmlParams | string;

export interface AmpTimeline {
  durationsAndIntervals: [number, number][],
  delayBeforeKeyboard: number,
  delayAfterKeyboard: number,
  autoProceedTimeout: number | null,
}

export interface AmpParams {
  stimuli: AmpStimuli[];
  timeline: AmpTimeline;
  acceptedKeys: string[];
  totalTrials: number;
  totalRounds: number;
  trialHtml: AmpTrialHtml;
}

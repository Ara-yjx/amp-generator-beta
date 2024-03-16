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

export interface AmpTrialHtml {
  width: number;
  height: number;
  marginTop: number;
  instruction: string;
  textFontSize: number;
  textIsBold: boolean;
  textColor?: string;
  textWrap: boolean;
  customHtml?: string; // this is like an "override"; under params mode it's undefined; when switching to custom mode, it gets rendered from params
  /** @deprecated */
  text?: string; // use instruction
}

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

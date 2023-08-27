export interface AmpStimuli {
  items: {content:string, count:number}[];
  shuffle: boolean | number;
}

export interface AmpTrialHtmlParams {
  width: number;
  height: number;
  text: string;
}
export type AmpTrialHtml = AmpTrialHtmlParams | string;

export interface AmpParams {
  stimuli: [AmpStimuli, AmpStimuli, AmpStimuli];
  timeline: [number, number, number, number, number];
  acceptedKeys: string[];
  totalTrials: number;
  nextTrialTimeout: number | null;
  trialHtml: AmpTrialHtml;
}

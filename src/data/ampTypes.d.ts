export interface AmpStimuli {
  items: {content:string, count:number}[];
  shuffle: boolean | number;
}

export interface AmpParams {
  stimuli: [AmpStimuli, AmpStimuli, AmpStimuli];
  timeline: [number, number, number, number, number];
  acceptedKeys: string[];
  totalTrials: number;
}

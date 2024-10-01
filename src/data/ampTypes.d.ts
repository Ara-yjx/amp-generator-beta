export interface AmpStimuliItem {
  uid: number;
  type: 'image' | 'text' | 'button';
  content: string;
  count: number;
}

export type AmpStimuliPrimeItem = {
  uid: number;
  name: string;
  includeUids: number[];
  excludeUids: number[];
  // undefined means no-override, null means selection box is explicit no-override
  overrideCount: (number | undefined) | (number | undefined)[] | null;
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
  darkMode: boolean;
  concurrentVerticalGap?: number; // effective only when concurrentDisplays enabled
  concurrentHorizontalGap?: number; // effective only when concurrentDisplays enabled
  customHtml?: string; // this is like an "override"; under params mode it's undefined; when switching to custom mode, it gets rendered from params
  /** @deprecated */
  text?: string; // use instruction
}

export type ConcurrentDisplayFrame = (number | 'empty')[][]; // [row][column]; 'empty' will map to -1; also called 'frame' in larger context

export interface AmpTimeline {
  durationsAndIntervals: [number, number][],
  delayBeforeKeyboard: number,
  delayAfterKeyboard: number,
  autoProceedTimeout: number | null,
  concurrentDisplays?: ConcurrentDisplayFrame[],
}


export type DisplayLayout = number[];

export namespace AT {

  type DisplaySrc =
    | ['pool', number] // poolIndex
    | ['copy', number, number, number] // page, row, col
    | ['blank'];
  type Condition = ['response', number, '==' | '!=', string[]]; // temp

  type LayoutedDisplayItem = {
    displaySrc: DisplaySrc;
    swap?: boolean;
    bindKeyboard?: string[];
    mouseClick?: boolean;
    mouseClickAccuratePoint?: boolean;
  };

  interface Page {
    // isConditionEnabled: boolean,
    condition?: Condition,
    // layout: Layout,
    // displays: { row: int, col: int, src: DisplaySrc }[],
    layoutedDisplays: LayoutedDisplayItem[][],
    response: {
      keyboard: { enabled: boolean, keys: string[], delayBefore?: number, delayAfter?: number },
      timeout: { enabled: boolean, duration: number },
      mouseClick: { enabled: boolean },
    },
    swap?: boolean,
    interval?: number;
  }

  type AdvancedTimeline = { pages: AT.Page[] };
}

export interface AmpParams {
  stimuli: AmpStimuli[];
  trialType: 'simple' | 'advanced';
  timeline?: AmpTimeline;
  advancedTimeline?: AT.AdvancedTimeline;
  acceptedKeys: string[];
  totalTrials: number;
  totalRounds: number;
  trialHtml: AmpTrialHtml;
}

import type { BranchNode, LeafNode, TreeNode } from '../component/tree';

export type uid = number;

export interface AmpStimuliStyle {
  fontSize?: number;
  color?: string;
  textAlign?: string;
  buttonPaddingLeftRight?: number;
  buttonPaddingTopBottom?: number;
  loop?: boolean;
  muted?: boolean;
}

export interface AmpStimuliItem {
  uid: uid;
  type: 'image' | 'text' | 'video' | 'button' | 'camera';
  content: string;
  count: number;
  style?: AmpStimuliStyle;
}

export type AmpStimuliPrimeItem = {
  uid: uid;
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
  style?: AmpStimuliStyle;
}


export interface MixedPoolSource {
  pool: number | string, // pool index or mixedPool name. TODO: should use pool uid instead
  count: ['constant', number] | ['uniform', number, number] | ['rest'];
}

export interface MixedPool {
  uid: uid;
  name: string;
  totalCount?: number;
  resetForEachTrial?: boolean;
  sources: MixedPoolSource[];
}

export interface AmpTrialHtml {
  width: number;
  height: number;
  marginTop: number; // corresponds to  AT containerTopBlank
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
    | ['pool', number[]] // poolIndexes
    | ['copy', number, number, number] // page, row, col
    | ['copy'] // undefined copy
    | ['blank'];
  //                                  pageIndex             responses: _AP|${key}|_MOUSE.${row}.${col}
  type ResponseCondition = ['response', number, '==' | '!=', string[]]
  //                                            pageIndex  key                  pools
  type PoolSelectionCondition = ['poolSelection', number, string, '==' | '!=', number[]]
  type ProbabilityCondition = ['probability', number];

  // for export
  type Condition =
    | ResponseCondition
    | PoolSelectionCondition
    | ProbabilityCondition
    | ['and' | 'or', ...Condition[]];

  type LayoutedDisplayItem = {
    displaySrc: DisplaySrc;
    swap?: boolean;
    bindKeyboard?: string[];
    mouseClick?: boolean;
    mouseClickAccuratePoint?: boolean;
  };

  type Style = {
    containerTopBlank?: number,
    itemWidth?: number,
    itemHeight?: number,
  }

  type BranchData = 'and' | 'or';
  type LeafData = ResponseCondition | PoolSelectionCondition | ProbabilityCondition | [undefined];
  type ConditionTree = TreeNode<BranchData, LeafData>;

  interface Page {
    // isConditionEnabled: boolean,
    // condition?: Condition,
    condition?: ConditionTree,
    // layout: Layout,
    // displays: { row: int, col: int, src: DisplaySrc }[],
    layoutedDisplays: LayoutedDisplayItem[][],
    response: {
      keyboard: { enabled: boolean, keys: string[], delayBefore?: number, delayAfter?: number },
      timeout: { enabled: boolean, duration: number },
      mouseClick: { enabled: boolean },
    },
    swap?: boolean,
    interval?: number,
    mouseTracking?: boolean,
    style?: Style,
  }

  type AdvancedTimeline = {
    pages: AT.Page[],
  };
}

export type BranchData = AT.BranchData;
export type LeafData = AT.LeafData;

export interface AmpParams {
  uidCounter?: number;
  stimuli: AmpStimuli[];
  isMixedPoolEnabled?: boolean,
  mixedPools?: MixedPool[];
  trialType: 'simple' | 'advanced';
  timeline?: AmpTimeline;
  advancedTimeline?: AT.AdvancedTimeline;
  acceptedKeys: string[];
  totalTrials: number;
  totalRounds: number;
  trialHtml: AmpTrialHtml;
  surveyIdentifier?: string;
}

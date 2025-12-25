import { sortBy, sum } from 'lodash';
import { AmpParams, AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem, AmpTrialHtml, AT, DisplayLayout, MixedPool, SelectedOutputItem } from '../data/ampTypes';


export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;


export type UidDetail = {
  type: 'stimuli',
  ref: AmpStimuliItem,
  index: number,
} | {
  type: 'prime',
  ref: AmpStimuliPrimeItem,
};

export function getUidDetail(uid: number, stimuli: AmpStimuli): UidDetail | undefined {
  const stimuliItemIndex = stimuli.items.findIndex(i => i.uid === uid);
  if (stimuliItemIndex !== -1) {
    return {
      type: 'stimuli',
      ref: stimuli.items[stimuliItemIndex],
      index: stimuliItemIndex,
    };
  }
  const primeItemFound = stimuli.prime.find(i => i.uid === uid);
  if (primeItemFound) {
    return {
      type: 'prime',
      ref: primeItemFound,
    }
  }
}

/** Return item index (1-based number) or prime name (string) */
export function findPrimeRepresentationFromUid(uid: number, stimuli: AmpStimuli): string | undefined {
  const detail = getUidDetail(uid, stimuli);
  if (detail?.type === 'stimuli') return `${detail.index + 1}`;
  if (detail?.type === 'prime') return detail.ref.name;
}

export function isAnyPrimeOverridePerRound(stimuli: AmpStimuli) {
  return stimuli.prime.some(prime => Array.isArray(prime.overrideCount));
}

export function getLayoutFromLayoutDisplays(layoutedDisplays: any[][]): number[] {
  return layoutedDisplays.map(x => x.length);
}


/** @deprecated */
export function getKeyInLayout(row: number, col: number, layout: DisplayLayout) {
  return String(sum(layout.slice(0, row)) + col + 1);
}

export function getDisplayKey(row: number, col: number) {
  return `${toAZRepresentation(row + 1)}${col + 1}`;
}

/** 
 * Input must be > 0.
 * 1 -> 'A', 2 -> 'B', 26 -> 'Z', 27 -> 'AA', 703 -> 'AAA' 
 */
export function toAZRepresentation(x: number): String {
  // This is actually not 26-based conversion, but shifted
  // In "AA"=27, the first A represents 1*26 rather than 0*26; the seconds A represents 1 rather than 0
  // Generally, in digits [dk,...,d2,d1,d0], digit di means (di+1)*26^i
  // So, although it's 26-carry-on, the value range of a digit is 1~26 instead of 0~25.
  // Thus when processing each digit, we need to -1 to counteract this offset
  const digits = []; // each digit is 0~25 here
  while (x > 0) {
    x--;
    digits.unshift(x % 26);
    x = Math.floor(x / 26);
  };
  const result = digits.map(n => String.fromCharCode(65 + n)).join('');
  return result;
}


export function forEach2d<T>(array2d: T[][], operation: (value: T, row: number, col: number) => void): void {
  array2d.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      operation(col, rowIndex, colIndex);
    })
  });
};

export function map2d<T, K>(array2d: T[][], operation: (value: T, row: number, col: number) => K): K[][] {
  return array2d.map((row, rowIndex) => (
    row.map((col, colIndex) => (
      operation(col, rowIndex, colIndex)
    ))
  ));
};

export function flatMap2d<T, K>(array2d: T[][], operation: (value: T, row: number, col: number) => K): K[] {
  return map2d(array2d, operation).flat();
}

export function isNotUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export function getTrialBackgroundColor(trialHtml?: AmpTrialHtml) {
  if (!trialHtml) return 'white';
  return (
    (trialHtml.customHtml ? null : trialHtml.backgroundColor) ||
    (trialHtml.darkMode ? 'black' : 'white')
  );
}

/** Get source simple-pool recursively. Return pool indexes. */
export function traceMixedPoolSourcePools(mixedPoolName: string, mixedPools: AmpParams['mixedPools']): number[] {
  // cross-reference of mixedPool is not allowed, so no need to worry about loops
  const sourcePools = mixedPools?.find(m => m.name === mixedPoolName)?.sources.flatMap(source =>
    source.pools.flatMap(sourcePool =>
      typeof sourcePool === 'string' ? traceMixedPoolSourcePools(sourcePool, mixedPools) : [sourcePool]
    )
  );
  return sourcePools ? sortBy([...new Set(sourcePools)]) : [];
}

export function traceSourcePools(displaySrc: AT.DisplaySrc, mixedPools: AmpParams['mixedPools']): number[] {
  switch (displaySrc[0]) {
    case 'pool':
      return displaySrc[1].flatMap(pool => typeof pool === 'string' ? traceMixedPoolSourcePools(pool, mixedPools) : [pool]);
    // TODO: copy
    default:
      return [];
  }
}

// When fitScreen, blankSpaceAtTop should be ignored, and fullscreen should be enabled
export function hasFitScreen(advancedTimeline: AmpParams['advancedTimeline']): boolean {
  // in the future when we add fitScreen to grid layout, we can remove the `p.layoutType === 'freeform'` here
  return !!advancedTimeline?.pages.some(p => p.layoutType === 'freeform' && p.fitScreen);
}

export function getDefaultSelectedOutputName(selectedOutput: Omit<SelectedOutputItem, 'outputName'>): string {
  const pageNum = selectedOutput.page + 1;
  switch (selectedOutput.type) {
    case 'response':
      return `response_${pageNum}`;
    case 'actualResponse':
      return `actualResponse_${pageNum}`;
    case 'stimuliItem': {
      const displayKey = selectedOutput.displayKey ?? '';
      return `stimuliItem_${pageNum}_${displayKey}`;
    }
    case 'actualStimuliItem': {
      const displayKey = selectedOutput.displayKey ?? '';
      return `actualStimuliItem_${pageNum}_${displayKey}`;
    }
  }
}

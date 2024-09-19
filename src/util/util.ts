import { range, sum } from 'lodash';
import { AmpParams, AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem, AmpTimeline, AT, DisplayLayout } from '../data/ampTypes';

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

export function getLayoutFromLayoutDisplays(layoutedDisplays: AT.Page['layoutedDisplays']): DisplayLayout {
  return layoutedDisplays.map(x => x.length);
}

export function getATUniversalLayout(advancedTimeline: AT.AdvancedTimeline): DisplayLayout {
  return getUniversalLayout(advancedTimeline.pages.map(page => getLayoutFromLayoutDisplays(page.layoutedDisplays)));
}

export function getCDUniversalLayout(concurrentDisplays: AmpTimeline['concurrentDisplays']): DisplayLayout {
  return concurrentDisplays ? getUniversalLayout(concurrentDisplays.map(display => display.map(x => x.length))) : [1];
}

export function getUniversalLayout(layouts: DisplayLayout[]): DisplayLayout {
  if (layouts.length === 0) {
    return [1];
  }
  const numOfRows = Math.max(...layouts.map(layout => layout.length));
  return range(numOfRows).map(rowIndex => (
    // max num of col for this fow
    Math.max(...layouts.map(layout => (
      layout.length > rowIndex ? layout[rowIndex] : 0
    )))
  ));
}

export function getKeyInLayout(row: number, col: number, layout: DisplayLayout) {
  return String(sum(layout.slice(0, row)) + col + 1);
}

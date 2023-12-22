import { AmpParams, AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem } from '../data/ampTypes';

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

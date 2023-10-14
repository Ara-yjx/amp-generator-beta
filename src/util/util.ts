import { AmpStimuli } from '../data/ampTypes';

/** Return item index or prime name */
export function findPrimeRepresentationFromUid(uid: number, stimuli: AmpStimuli): number | string | undefined {
  const { items, prime } = stimuli;
  const findItemsIndex = items.findIndex(i => i.uid === uid);
  if (findItemsIndex !== -1) {
    return findItemsIndex + 1;
  }
  return prime.find(i => i.uid === uid)?.name;
}
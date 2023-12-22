import type { AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem } from './ampTypes';
import range from 'lodash/range';
import sortBy from 'lodash/sortBy'
import sum from 'lodash/sum'
import { emptyAmpParams } from './emptyAmpParams';


/** [pool][round] -> Possibilities|counts */
export interface PrimeValidation {
  steppedPossibilities: SteppedPossibilities[][],
  possibilities: Possibility[][][],
  possibleTotalItems: number[][][],
}

export function getPrimeValidation(stimuli: AmpStimuli[], totalRounds: number): PrimeValidation {
  const steppedPossibilities = stimuli.map(s => range(totalRounds).map(round => getAllPossibilitiesForRound(s, round))); // [poolIndex][round][prime]
  const possibilities = steppedPossibilities.map(poolSpo => poolSpo.map(roundSpo => roundSpo.at(-1)![1]));
  const possibleTotalItems = possibilities.map(poolPossibilities => poolPossibilities.map(getPossibilityTotalItemsClean));
  return { steppedPossibilities, possibilities, possibleTotalItems }
}

export type PrimeResult =
  | { type: 'stimuli', uid: number }
  | { type: 'prime', uid: number | null, primeUid: number }
  | { type: null, uid: null }

export interface Possibility {
  stimuliCount: Map<number, number>; // stimuli uid -> count
  primeResults: Map<number, PrimeResult>; // prime uid -> stimuli uid
  isInvalidPrimeResult?: boolean; // primeResult is null
}
export type SteppedPossibilities = [number | null, Possibility[]][]; // possibilities after applying each prime, first item is prime uid

export function getAllPossibilitiesForRound(stimuli: AmpStimuli, round: number): SteppedPossibilities {
  const initialPossibility = getInitialPossibilityForRound(stimuli);
  console.log('getAllPossibilitiesForRound initialPossibility', initialPossibility)
  const possibilities: SteppedPossibilities = [[null, [initialPossibility]]];

  if (!stimuli.isEnablePriming) return possibilities; // BREAK to save some computations and avoid bugs

  for (const prime of stimuli.prime) {
    const possibilitiesOfPrime = possibilities.at(-1)![1].flatMap(
      po => getPossibilitiesOneStep(po, prime, round)
    );
    possibilities.push([prime.uid, possibilitiesOfPrime]);
  }
  return possibilities;
}

export function getInitialPossibilityForRound(stimuli: AmpStimuli): Possibility {
  const itemUids = new Map(stimuli.items.map((item, index) => [item.uid, [item, index]])) as Map<number, [AmpStimuliItem, number]>; // uid -> [item, index]
  // represent all with uids
  return {
    stimuliCount: new Map([...itemUids.entries()].map(([uid, [item]]) => [uid, item.count])),
    primeResults: new Map(),
  };
}


/** Get all possibilities of applying one primeItem based on given possibility */
export function getPossibilitiesOneStep(possibility: Possibility, primeItem: AmpStimuliPrimeItem, round: number): Possibility[] {
  // console.log('getPossibilities', possibility, primeItem)
  const includedStimuliItem: PrimeResult[] = primeItem.includeUids.length ? (
    primeItem.includeUids.map(uid => {
      if (possibility.stimuliCount.has(uid)) {
        return { type: 'stimuli', uid: uid };
      } else if (possibility.primeResults.has(uid)) {
        return { type: 'prime', uid: possibility.primeResults.get(uid)!.uid, primeUid: uid };
      } else {
        return { type: null, uid: null };
      }
    })
  ) : (
    [...possibility.stimuliCount.keys()].map(uid => ({ type: 'stimuli', uid }))
  ); // prime ref => stimuli uid
  // console.log('includedStimuliItem', includedStimuliItem)
  const excludedStimuliItem: PrimeResult[] = primeItem.excludeUids.map(uid => {
    if (possibility.stimuliCount.has(uid)) {
      return { type: 'stimuli', uid: uid };
    } else if (possibility.primeResults.has(uid)) {
      return { type: 'prime', uid: possibility.primeResults.get(uid)!.uid, primeUid: uid };
    } else {
      return { type: null, uid: null };
    }
  }); // prime ref => stimuli uid 
  // console.log('excludedStimuliItem', excludedStimuliItem)

  const primeSelections = includedStimuliItem.filter(x => !excludedStimuliItem.some(y => y.uid === x.uid));
  // console.log('primeSelections', primeSelections)
  if (primeSelections.length) {
    return primeSelections.map(selection => {
      const primeResults = new Map(possibility.primeResults).set(primeItem.uid, selection);
      const stimuliCount = new Map(possibility.stimuliCount);
      const overrideCount = Array.isArray(primeItem.overrideCount) ? primeItem.overrideCount[round] ?? null
        : typeof primeItem.overrideCount === 'number' ? primeItem.overrideCount
          : null;
      if (overrideCount !== null) {
        stimuliCount.set(selection.uid!, overrideCount);
      }
      return { stimuliCount, primeResults };
    })
  } else {
    return [{
      stimuliCount: new Map(possibility.stimuliCount),
      primeResults: new Map(possibility.primeResults).set(primeItem.uid, { type: null, uid: null }),
      isInvalidPrimeResult: true,
    }]
  }
}

// Reports

export function getPossiblityTotalItems(possibility: Possibility) {
  return sum([...possibility.stimuliCount.values()]);
}

export function getPossibilityTotalItemsClean(roundPossiblities: Possibility[]): number[] {
  const itemsCounts = roundPossiblities.map(getPossiblityTotalItems);
  const itemsCountsClean = sortBy([...new Set(itemsCounts)]); // dedupe and sort
  console.log('getPossibilityTotalItemsClean', roundPossiblities, itemsCountsClean)
  return itemsCountsClean;
}


/** See it this prime has any null result at any state */
export function validatePrimeItem(
  steppedPossibilities: SteppedPossibilities[][],
  poolIndex: number,
  prime: AmpStimuliPrimeItem,
) {
  // We don't care about which round because possibilities of primeResult is the same for each round. Only check the first round.
  const roundPossibilities = steppedPossibilities[poolIndex][0];
  const primePossibilities = roundPossibilities.find(([uid]) => uid === prime.uid)![1];
  return primePossibilities.filter(po =>
    [...po.primeResults.values()].some(primeResult => primeResult.type === null)
  );
}


// For default state and context
export const initialPrimeValidation = getPrimeValidation(emptyAmpParams.stimuli, emptyAmpParams.totalRounds);

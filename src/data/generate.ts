import qsfTemplate from '../assets/qsfTemplate.json';
import { type UidDetail, flatMap2d, forEach2d, getDisplayKey, getUidDetail, map2d } from '../util/util';
import type { AmpParams, AmpStimuliPrimeItem, AmpTimeline, AT } from './ampTypes';
import { renderATTrialHtml, renderTrialHtml } from './renderTrialHtml';

interface EmbeddedDataTemplate {
  Description: string;
  Field: string;
  Type: string;
  Value?: string;
}
export function hydrateQsf(params: AmpParams) {
  const template = qsfTemplate;

  // Set embedded data

  /* @ts-ignore */
  const embeddedData = template.SurveyElements[1].Payload.Flow[0].EmbeddedData as EmbeddedDataTemplate[];
  function setEd(name: string, value: any) {
    const ed = embeddedData.find(ed => ed.Field === name);
    if (ed) {
      if (value === null) {
        ed.Type = 'Recipient';
        ed.Value = undefined; // Value field will be removed when stringify. That's how Qualtrics represents empty value.
      } else if (typeof value === 'object') {
        ed.Value = JSON.stringify(value);
      } else {
        ed.Value = `${value}`; // (undefined, true, false...) are parsed to strings
      }
    }
  }

  const stimuliItems = [{
    pools: params.stimuli.map(({ items, shuffle }) => ({
      items: items.map(({ type, content, count }) => ({ type, content, count })),
      shuffle: shuffle,
    })),
    totalTrials: params.totalTrials,
  }];
  setEd('stimuliItems', stimuliItems);
  setEd('totalRounds', params.totalRounds);
  // need to check params.advancedTimeline here, because the moment the toggle is clicked, advancedTimeline is not generated immediately yet and is still undef
  if (params.trialType === 'advanced' && params.advancedTimeline) {
    setEd('timeline', transformAdvancedTimeline(params.advancedTimeline!));
  } else {
    if (params.timeline?.concurrentDisplays) {
      setEd('timeline', { ...params.timeline, concurrentDisplays: transformConcurrentDisplays(params.timeline.concurrentDisplays) });
    } else {
      setEd('timeline', params.timeline);
    }
  }
  setEd('primes', exportPrime(params));
  setEd('acceptedKeys', params.acceptedKeys.join(','));
  setEd('darkMode', params.trialHtml.darkMode);

  // Render trial html

  const trialSurveyElement = template.SurveyElements.find(e => e.PrimaryAttribute === 'QID2')
  if (trialSurveyElement) {
    // @ts-ignore
    trialSurveyElement.Payload.QuestionText = generateTrialHtml(params);
    // @ts-ignore
    trialSurveyElement.Payload.QuestionDescription = '';
    // @ts-ignore
    trialSurveyElement.SecondaryAttribute = '';
  } else {
    console.error('Failed to render trialHtml: qsf question element QID2 not found.')
  }

  return template;
}

export function generateTrialHtml(params: AmpParams): string {
  if (params.trialHtml.customHtml) {
    return params.trialHtml.customHtml;
  } else if (params.advancedTimeline) {
    return renderATTrialHtml(params.trialHtml, params.advancedTimeline);
  } else {
    return renderTrialHtml(params.trialHtml, params.timeline?.concurrentDisplays);
  }
}

export function generateQsfString(params: AmpParams) {
  const hydrated = hydrateQsf(params);
  return JSON.stringify(hydrated);
}

export function generateBlob(str: string) {
  return new Blob([str], { type: 'text/plain' });
}

function exportPrime(params: AmpParams) {
  const primes = params.stimuli.flatMap((stimuli, poolIndex) => (
    stimuli.prime.map(primeItem => ({ ...primeItem, stimuli, poolIndex }))
  ));
  return primes.map(({ uid, name, includeUids, excludeUids, overrideCount, stimuli, poolIndex }) => {
    /** prime export name or stimuli item index (1-based) */
    function getPrimeRefForExport(uidDetail?: UidDetail) {
      if (uidDetail?.type === 'prime') {
        return getPrimeExportName(poolIndex, uidDetail.ref.name);
      } else if (uidDetail?.type === 'stimuli') {
        return uidDetail.index + 1;
      }
    }
    const include = includeUids.flatMap(uid => (
      getPrimeRefForExport(getUidDetail(uid, stimuli)) ?? []
    ));
    const exclude = excludeUids.flatMap(uid => (
      getPrimeRefForExport(getUidDetail(uid, stimuli)) ?? []
    ));
    return {
      name: getPrimeExportName(poolIndex, name),
      pool: poolIndex + 1,
      include: include?.length ? include : undefined,
      exclude: exclude?.length ? exclude : undefined,
      overrideCount: exportOverrideCount(overrideCount),
    }
  });
}

function getPrimeExportName(poolIndex: number, name: string) {
  return `stimuli_${poolIndex + 1}_${name}`;
}

function exportOverrideCount(overrideCount: AmpStimuliPrimeItem['overrideCount']) {
  if (Array.isArray(overrideCount)) {
    return overrideCount.map(x => x === undefined ? null : x);
  } else if (overrideCount === undefined) {
    return null;
  } else { // number or null
    return overrideCount;
  }
}

function transformConcurrentDisplays(concurrentDisplays: AmpTimeline['concurrentDisplays']) {
  return concurrentDisplays?.map(frame => (
    map2d(frame, (pool, row, col) => ({
      key: getDisplayKey(row, col),
      pool: typeof pool === 'number' ? pool + 1 : 0, // empty
    })).flat()
  ));
}


type ExportPageDisplaySrc = ['pool', number] | ['copy', number, string] | null;

function transformAdvancedTimeline(advancedTimeline: AT.AdvancedTimeline) {
  const { pages } = advancedTimeline;
  return {
    advanced: true,
    pages: pages.map((page, pageIndex) => ({
      condition: transformATCondition(page.condition),
      displays: transformATDisplays(page.layoutedDisplays),
      response: transfromATResponse(page),
      interval: pageIndex === pages.length - 1 ? undefined : (page.interval ?? 0),
      swap: transformATSwap(page),
    }))
  };

  function transformATCondition(condition: AT.Page['condition']) {
    if (condition) {
      const conditionCopy = [...condition] as AT.Condition;
      conditionCopy[1] += 1;
      conditionCopy[3].forEach((conditionValue, conditionValueIndex) => {
        const [type, row, col] = conditionValue.split('.');
        if (type === '_MOUSE') { // TODO: use displayKey directly which matches the actual response
          const mouseClickKey = getDisplayKey(parseInt(row), parseInt(col));
          conditionCopy[3][conditionValueIndex] = mouseClickKey;
        }
      })
      return conditionCopy;
    }
  }

  function transformATDisplays(layoutedDisplays: AT.Page['layoutedDisplays']) {
    const result: { [key: string]: ExportPageDisplaySrc } = {};
    forEach2d(layoutedDisplays, ({ displaySrc }, row, col) => {
      const displayKey = getDisplayKey(row, col);
      if (displaySrc[0] === 'blank') {
        result[displayKey] = ['pool', 0];
      } else if (displaySrc[0] === 'pool') {
        result[displayKey] = ['pool', displaySrc[1] + 1];
      } else if (displaySrc[0] === 'copy') {
        const [_, copyPage, copyRow, copyCol] = displaySrc;
        result[displayKey] = ['copy', copyPage + 1, getDisplayKey(copyRow, copyCol)];
      }
    });
    return result;
  }

  function transfromATResponse(page: AT.Page) {
    const result: any = {};
    const { response, layoutedDisplays } = page;
    if (response.keyboard.enabled) {
      result.keyboard = { keys: response.keyboard.keys, delayBefore: response.keyboard.delayBefore };
    }
    if (response.timeout.enabled) {
      result.timeout = { duration: response.timeout.duration };
    }
    if (response.mouseClick.enabled) {
      result.mouseClick = Object.fromEntries(
        flatMap2d(layoutedDisplays, (displayItem, row, col) => ({ key: getDisplayKey(row, col), displayItem }))
          .filter(({ displayItem }) => displayItem.mouseClick)
          .map(({ key, displayItem }) => [key, displayItem.mouseClickAccuratePoint ? { accuratePoint: true } : {}])
      );
    }
    return result;
  }

  function transformATSwap(page: AT.Page) {
    if (page.swap) {
      const result: { [displayKey: string]: { bindKeyboard: string[] } } = {};
      forEach2d(page.layoutedDisplays, ({ swap, bindKeyboard }, row, col) => {
        if (swap) {
          result[getDisplayKey(row, col)] = { bindKeyboard: bindKeyboard ?? [] };
        }
      });
      return result;
    }
  }
}

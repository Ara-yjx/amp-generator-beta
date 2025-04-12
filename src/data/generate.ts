import { cloneDeep, range } from 'lodash';
import qsfTemplate from '../assets/qsfTemplate.json';
import { type UidDetail, flatMap2d, forEach2d, getDisplayKey, getUidDetail, isNotUndefined, map2d } from '../util/util';
import type { AmpParams, AmpStimuliStyle, AmpStimuliPrimeItem, AmpTimeline, AT, BranchData, LeafData } from './ampTypes';
import { renderATTrialHtml, renderTrialHtml } from './renderTrialHtml';
import { traverseTree } from './tree';

interface EmbeddedDataTemplate {
  Description: string;
  Field: string;
  Type: string;
  Value?: string;
}
export function hydrateQsf(params: AmpParams) {
  const template = cloneDeep(qsfTemplate);

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
    pools: params.stimuli.map(({ items, shuffle, style }) => ({
      items: items.map(item => ({ type: item.type, content: item.content, count: item.count, style: transformStyle(item.style) })),
      shuffle: shuffle,
      style: transformStyle(style),
    })),
    totalTrials: params.totalTrials,
  }];
  setEd('stimuliItems', stimuliItems);
  setEd('totalRounds', params.totalRounds);
  // need to check params.advancedTimeline here, because the moment the toggle is clicked, advancedTimeline is not generated immediately yet and is still undef
  if (params.trialType === 'advanced' && params.advancedTimeline) {
    setEd('timeline', transformAdvancedTimeline(params.advancedTimeline));
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

  addOutputEdForMouseTracking(params, template);
  addSurveyIdentifier(params, template);

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


type ExportPageDisplaySrc = ['pool', number[]] | ['copy', number, string] | ['blank'] | null;

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
      mouseTracking: transformATMouseTracking(page),
      style: page.style,
    }))
  };


  // Generate new one
  function transformATCondition(conditionTree: AT.ConditionTree): AT.Condition | undefined {
    if (!conditionTree) return;

    const result = traverseTree<AT.BranchData, AT.LeafData, AT.Condition | undefined>(conditionTree, (data, children) => {

      if (typeof data === 'object') {
        if (data[0] === 'response') {
          return [
            'response',
            data[1] + 1, // pageIndex
            data[2], // '==' | '!='
            data[3].map((response: string) => { // responses: _AP | ${key} | _MOUSE.${row}.${col}
              const [type, row, col] = response.split('.');
              if (type === '_MOUSE') {
                return getDisplayKey(parseInt(row), parseInt(col));
              } else if (type === '_AP') {
                return 'TIMEOUT';
              } else {
                return response;
              }
            }),
          ];

        } else if (data[0] === 'poolSelection') {
          return [
            'poolSelection',
            data[1] + 1, // pageIndex
            data[2], // key
            data[3], // '==' | '!='
            data[4].map(poolIndex => poolIndex + 1), // pools
          ];

        } else if (data[0] === 'probability') {
          return typeof data[1] === 'number' ? [...data] : ['probability', 1]; // 100% if undefined
        }

      } else if (data === 'and' || data === 'or') {
        const filteredChildren = children?.filter(isNotUndefined);
        if (filteredChildren?.length) {
          return [data, ...filteredChildren];
        }
      }
    });

    return result;
  }

  function transformATDisplays(layoutedDisplays: AT.Page['layoutedDisplays']) {
    const result: { [key: string]: ExportPageDisplaySrc } = {};
    forEach2d(layoutedDisplays, ({ displaySrc }, row, col) => {
      const displayKey = getDisplayKey(row, col);
      if (displaySrc[0] === 'blank') {
        result[displayKey] = ['blank'];
      } else if (displaySrc[0] === 'pool') {
        result[displayKey] = ['pool', displaySrc[1].map(poolIndex => poolIndex + 1)];
      } else if (displaySrc[0] === 'copy') {
        const [, copyPage, copyRow, copyCol] = displaySrc;
        if (copyPage !== undefined && copyRow !== undefined && copyCol !== undefined) {
          result[displayKey] = ['copy', copyPage + 1, getDisplayKey(copyRow, copyCol)];
        }
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

  function transformATMouseTracking(page: AT.Page) {
    return page.response.mouseClick.enabled && page.mouseTracking;
  }
}

/** In-place. */
function addOutputEdForMouseTracking(params: AmpParams, template: any) {
  if (!(params.trialType === 'advanced' && params.advancedTimeline)) return;
  /* @ts-ignore */
  const outputEd = template.SurveyElements[1].Payload.Flow[1].EmbeddedData as EmbeddedDataTemplate[];
  function addOutputEd(name: string, value = '') {
    outputEd.push({
      Description: name,
      Type: 'Recipient',
      Field: name,
      VariableType: 'String',
      DataVisibility: [],
      AnalyzeText: false,
      Value: value,
    } as EmbeddedDataTemplate)
  }
  for (const iRound of range(params.totalRounds)) {
    for (const iTrial of range(params.totalTrials)) {
      params.advancedTimeline.pages.forEach((page, iPage) => {
        if (page.response.mouseClick.enabled && page.mouseTracking) {
          addOutputEd(`spt_MT_x_r=${iRound + 1}_t=${iTrial + 1}_p=${iPage + 1}`);
          addOutputEd(`spt_MT_y_r=${iRound + 1}_t=${iTrial + 1}_p=${iPage + 1}`);
          addOutputEd(`spt_MT_t_r=${iRound + 1}_t=${iTrial + 1}_p=${iPage + 1}`);
        }
      })
    }
  }
}

/** In-place */
function addSurveyIdentifier(params: AmpParams, template: any) {
  if (params.surveyIdentifier) {
    // Rename all EDs
    /* @ts-ignore */
    const inputEd = template.SurveyElements[1].Payload.Flow[0].EmbeddedData as EmbeddedDataTemplate[];
    inputEd.forEach(ed => {
      ed.Field += `:${params.surveyIdentifier}`;
      ed.Description += `:${params.surveyIdentifier}`;
    });
    /* @ts-ignore */
    const outputEd = template.SurveyElements[1].Payload.Flow[1].EmbeddedData as EmbeddedDataTemplate[];
    outputEd.forEach(ed => {
      ed.Field += `:${params.surveyIdentifier}`;
      ed.Description += `:${params.surveyIdentifier}`;
    });

    // Add sptSurveyIdentifier ED
    inputEd.unshift({
      Description: 'sptSurveyIdentifier',
      Type: 'Custom',
      Field: 'sptSurveyIdentifier',
      VariableType: 'String',
      DataVisibility: [],
      AnalyzeText: false,
      Value: params.surveyIdentifier,
    } as EmbeddedDataTemplate);
  }
}

function transformStyle(style: AmpStimuliStyle | undefined) {
  if (!style) return undefined;
  const result: any = { ...style };
  if (result.fontSize !== undefined) {
    result.fontSize = result.fontSize + 'px';
  }
  if (result.buttonPaddingTopBottom !== undefined) {
    result.buttonPaddingTopBottom = result.buttonPaddingTopBottom + 'px';
  }
  if (result.buttonPaddingLeftRight !== undefined) {
    result.buttonPaddingLeftRight = result.buttonPaddingLeftRight + 'px';
  }
  if (result.loop !== undefined) {
    result.loop = JSON.parse(result.loop);
  }
  if (result.muted !== undefined) {
    result.muted = JSON.parse(result.muted);
  }
  return result;
}

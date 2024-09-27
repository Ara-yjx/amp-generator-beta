import { forEach2d } from '../util/util';
import type { AmpParams, AT } from './ampTypes';
import { emptyAmpParams } from './emptyAmpParams';

export function transformOldValues(values: AmpParams) {
  console.log('transformOldValues');
  console.log(JSON.stringify(values));

  values.trialType ??= 'simple';
  if (typeof values.trialHtml !== 'string') {
    if (values.trialHtml.text !== undefined) {
      values.trialHtml.instruction = values.trialHtml.text;
      values.trialHtml.text = undefined;
    }
    values.trialHtml.textFontSize ??= 28;
    values.trialHtml.textIsBold ??= true;
    values.trialHtml.textWrap ??= true;
    values.trialHtml.darkMode ??= false;
  } else {
    // Move string-type trialHtml into trialHtml.customHtml, and fill the config with default values
    values.trialHtml = {
      ...emptyAmpParams.trialHtml,
      customHtml: values.trialHtml,
    }
  }


  if (values.advancedTimeline) {
    for (const page of values.advancedTimeline.pages) {

      // Create { enabled: false } for all undefined AT response
      // Same as advancedTimeline: emptyPage()
      page.response.keyboard ??= { enabled: false, keys: [], delayBefore: 0, delayAfter: 0 };
      page.response.timeout ??= { enabled: false, duration: 1000 };
      page.response.mouseClick ??= { enabled: false };

      // Previouisly LayoutedDisplayItem is same as ED: 
      //   AT.Page['layoutedDisplay'] = DisplaySrc[][] 
      // Now it's further wrapped
      //   AT.Page['layoutedDisplay'] = { displaySrc: DisplaySrc, ... }[][]
      forEach2d(page.layoutedDisplays as unknown[][], (displayItem, row, col) => {
        if (
          (displayItem as AT.LayoutedDisplayItem).displaySrc === undefined &&
          typeof (displayItem as AT.DisplaySrc)[0] === 'string'
        ) {
          page.layoutedDisplays[row][col] = { displaySrc: (displayItem as AT.DisplaySrc) };
        }
      })
    }
  }


  console.log('=>');
  console.log(JSON.stringify(values))
}

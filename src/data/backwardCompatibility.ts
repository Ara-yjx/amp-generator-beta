import type { AmpParams } from './ampTypes';
import { emptyAmpParams } from './emptyAmpParams';

export function transformOldValues(values: AmpParams) {
  console.log('transformOldValues');
  console.log(JSON.stringify(values))
  if (typeof values.trialHtml !== 'string') {
    if (values.trialHtml.text !== undefined) {
      values.trialHtml.instruction = values.trialHtml.text;
      values.trialHtml.text = undefined;
    }
    values.trialHtml.textFontSize ??= 28;
    values.trialHtml.textIsBold ??= true;
    values.trialHtml.textWrap ??= true;

  } else {
    // Move string-type trialHtml into trialHtml.customHtml, and fill the config with default values
    values.trialHtml = {
      ...emptyAmpParams.trialHtml,
      customHtml: values.trialHtml,
    }
  }
  console.log(JSON.stringify(values))
}

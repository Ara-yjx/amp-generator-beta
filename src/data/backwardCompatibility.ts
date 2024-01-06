import type { AmpParams, AmpTrialHtmlParams } from './ampTypes';
import { emptyAmpParams } from './emptyAmpParams';


export function transformOldValues(values: AmpParams) {
  if (typeof values.trialHtml !== 'string') {
    if (values.trialHtml.text !== undefined) {
      // console.log('backward compatibility: trialHtml.text', values.trialHtml.text);
      values.trialHtml.instruction = values.trialHtml.text;
      values.trialHtml.text = undefined;
    }
    const emptyTrialHtml = emptyAmpParams.trialHtml as AmpTrialHtmlParams;
    values.trialHtml.textFontSize ??= emptyTrialHtml.textFontSize;
    values.trialHtml.textIsBold ??= emptyTrialHtml.textIsBold;
  }
}

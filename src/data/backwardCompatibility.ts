import type { AmpParams } from './ampTypes';


export function transformOldValues(values: AmpParams) {
  if (typeof values.trialHtml !== 'string') {
    if (values.trialHtml.text !== undefined) {
      // console.log('backward compatibility: trialHtml.text', values.trialHtml.text);
      values.trialHtml.instruction = values.trialHtml.text;
      values.trialHtml.text = undefined;
    }
    values.trialHtml.textFontSize ??= 28;
    values.trialHtml.textIsBold ??= true;
    values.trialHtml.textWrap ??= true;
  }
}

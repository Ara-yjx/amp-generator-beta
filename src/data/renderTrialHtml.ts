import { TRIAL_TEMPLATE } from '../assets/trialHtml';
import { AmpTrialHtmlParams } from './ampTypes';

export function renderTrialHtml(params: AmpTrialHtmlParams) {
  console.log('renderTrialHtml', params)
  return TRIAL_TEMPLATE
    .replace('{{width}}', `${params.width}`)
    .replace('{{height}}', `${params.height}`)
    .replace('{{instruction}}', `${params.instruction}`)
    .replace('{{marginTop}}', `${params.marginTop}`)
    .replace('{{textFontSize}}', `${params.textFontSize}`)
    .replace('{{textFontWeight}}', params.textIsBold ? 'bold' : 'normal')
    .replace('{{textColor}}', params.textColor ?? 'inherit')
    .replace('{{textWrap}}', params.textWrap ? 'pre-line' : 'pre')
    ;
}

import { TRIAL_TEMPLATE } from '../assets/trialHtml';
import { AmpTrialHtmlParams } from './ampTypes';

export function renderTrialHtml(params: AmpTrialHtmlParams) {
  return TRIAL_TEMPLATE
    .replace('{{width}}', `${params.width}`)
    .replace('{{height}}', `${params.height}`)
    .replace('{{text}}', `${params.text}`)
    .replace('{{marginTop}}', `${params.marginTop}`)
  ;
}

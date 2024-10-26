import { AmpParams } from './ampTypes';
import { uid } from './uid';

export const emptyAmpParams: AmpParams = {
  stimuli: [
    {
      items: [
        { type: 'text', content: '', count: 1, uid: uid() },
      ],
      shuffle: false,
      isEnablePriming: false,
      prime: [],
    },
    {
      items: [
        { type: 'text', content: '', count: 1, uid: uid() },
      ],
      shuffle: false,
      isEnablePriming: false,
      prime: [],
    },
  ],
  trialType: 'simple',
  timeline: {
    durationsAndIntervals: [[100, 125]],
    delayAfterKeyboard: 0,
    delayBeforeKeyboard: 0,
    autoProceedTimeout: null,
  },
  acceptedKeys: ['d', 'k'],
  totalTrials: 1,
  totalRounds: 1,
  trialHtml: {
    width: 300,
    height: 300,
    marginTop: 50,
    instruction: 'You can add trial instructions here, \nbut a more flexible way is to add a Text/Graphic question manually in Qualtrics.',
    textFontSize: 28,
    textIsBold: true,
    textColor: undefined,
    textWrap: true,
    darkMode: false,
  },
  surveyIdentifier: undefined,
};

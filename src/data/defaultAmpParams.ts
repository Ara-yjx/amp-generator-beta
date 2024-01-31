import range from 'lodash/range';
import { AmpParams } from './ampTypes';
import { uid } from './uid';

const uidRef = {
  'stimuli[0].items[0]': uid(),
  'stimuli[0].prime[0]': uid(),
} as const;

const { host, origin, pathname } = window.location;
const publicUrl = host.startsWith('localhost:') ? (
  'https://spbuilder.org'
) : (
  (origin + pathname).replace(/\/+$/, '') // remove trailing '/'s
);

export const defaultAmpParams: AmpParams = {
  stimuli: [
    {
      items: [
        { type: 'image', content: `${publicUrl}/sample-images/1-01.jpg`, count: 5, uid: uidRef['stimuli[0].items[0]'] },
        { type: 'image', content: `${publicUrl}/sample-images/1-02.jpg`, count: 5, uid: uid() },
        { type: 'image', content: `${publicUrl}/sample-images/1-03.jpg`, count: 5, uid: uid() },
        { type: 'image', content: `${publicUrl}/sample-images/1-04.jpg`, count: 5, uid: uid() },
      ],
      shuffle: 2,
      isEnablePriming: true,
      prime: [
        { name: 'learned_1', includeUids: [uidRef['stimuli[0].items[0]']], excludeUids: [], overrideCount: 20, uid: uidRef['stimuli[0].prime[0]'] },
        { name: 'control_1', includeUids: [], excludeUids: [uidRef['stimuli[0].prime[0]']], overrideCount: null, uid: uid() },
      ],
    },
    {
      items: range(20).map(i => (
        { type: 'image', content: `${publicUrl}/sample-images/2-${('0' + String(i + 1)).slice(0, 2)}.jpg`, count: 1, uid: uid() } as const
      )),
      shuffle: true,
      isEnablePriming: false,
      prime: [],
    },
    {
      items: [
        { type: 'image', content: `${publicUrl}/sample-images/3-01.jpg`, count: 20, uid: uid() },
      ],
      shuffle: false,
      isEnablePriming: false,
      prime: [],
    },
  ],
  timeline: {
    durationsAndIntervals: [[75, 125], [100, 125]],
    delayAfterKeyboard: 0,
    delayBeforeKeyboard: 0,
    autoProceedTimeout: null,
  },
  acceptedKeys: ['d', 'k'],
  totalTrials: 20,
  totalRounds: 1,
  trialHtml: {
    width: 300,
    height: 300,
    marginTop: 50,
    instruction: 'd key = less pleasant        :        k key = more pleasant',
    textFontSize: 28,
    textIsBold: true,
    textColor: '#000000',
  }
};

import { AmpParams } from './ampTypes';
import { uid } from './uid';

const uidRef = {
  'stimuli[0].items[0]': uid(),
  'stimuli[0].prime[0]': uid(),
} as const;

export const defaultAmpParams: AmpParams = {
  stimuli: [
    {
      items: [
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_zANlu6B1UFbcflF', count: 5, uid: uidRef['stimuli[0].items[0]'] },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_vQzlOEGBXbnuhSn', count: 5, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_XJw0GZWrbUlfyOI', count: 5, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_E72k4fxbh7Zxw7e', count: 5, uid: uid() },
      ],
      shuffle: 2,
      isEnablePriming: true,
      prime: [
        { name: 'learned_1', includeUids: [uidRef['stimuli[0].items[0]']], excludeUids: [], isEnableOverrideCount: false, overrideCount: 0, uid: uidRef['stimuli[0].prime[0]'] },
        { name: 'control_1', includeUids: [], excludeUids: [uidRef['stimuli[0].prime[0]']], isEnableOverrideCount: true, overrideCount: 20, uid: uid() },
      ],
    },
    {
      items: [
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_3jUT9yhSx8mI5wy', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_25WNyckTIXiv4bQ', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9HRiGBCgN50xZI2', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_bqP6msi7K3SPhPM', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8q8uD7MVCDyWdzo', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_5jy9Uo2ZV2BaPki', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_3KIqzYFkmmCv3cq', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2lYARTfPvNPiwF8', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8CagBSGuqa3103k', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_eXWu2juJ3IFpiia', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9t0w55KTUPY9uK2', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_5jo1Wq1EpYoas3s', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_81blvWQpZDlael8', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_0U7PxswipvQuNrU', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2gZtO50zqBd39B4', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2aQYOy04gO7kx4G', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9yt21bg0o84Tt9c', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_03srJoTDehJb2V8', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_4YIfcyT8d1xghlI', count: 1, uid: uid() },
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8qUdZ0CwAXeCKxM', count: 1, uid: uid() },
      ],
      shuffle: true,
      isEnablePriming: false,
      prime: [],
    },
    {
      items: [
        { type: 'image', content: 'https://upenn.co1.qualtrics.com/CP/Graphic.php?IM=IM_bQlal1oB5kyb60m', count: 20, uid: uid() },
      ],
      shuffle: false,
      isEnablePriming: false,
      prime: [],
    },
  ],
  timeline: [75, 125, 100, 125, 0, 0],
  acceptedKeys: ['d', 'k'],
  totalTrials: 20,
  autoProceedTimeout: null,
  trialHtml: {
    width: 300,
    height: 300,
    text: 'd key = less pleasant        :        k key = more pleasant',
  }
};

import { AmpParams } from './ampTypes';

export const defaultAmpParams: AmpParams = {
  stimuli: [
    {
      items: [
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_zANlu6B1UFbcflF', count: 5 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_vQzlOEGBXbnuhSn', count: 5 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_XJw0GZWrbUlfyOI', count: 5 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_E72k4fxbh7Zxw7e', count: 5 },
      ],
      shuffle: 2,
    },
    {
      items: [
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_3jUT9yhSx8mI5wy', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_25WNyckTIXiv4bQ', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9HRiGBCgN50xZI2', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_bqP6msi7K3SPhPM', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8q8uD7MVCDyWdzo', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_5jy9Uo2ZV2BaPki', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_3KIqzYFkmmCv3cq', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2lYARTfPvNPiwF8', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8CagBSGuqa3103k', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_eXWu2juJ3IFpiia', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9t0w55KTUPY9uK2', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_5jo1Wq1EpYoas3s', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_81blvWQpZDlael8', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_0U7PxswipvQuNrU', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2gZtO50zqBd39B4', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_2aQYOy04gO7kx4G', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_9yt21bg0o84Tt9c', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_03srJoTDehJb2V8', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_4YIfcyT8d1xghlI', count: 1 },
        { content: 'https://upenn.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_8qUdZ0CwAXeCKxM', count: 1 },
      ],
      shuffle: true,
    },
    {
      items: [
        { content: 'https://upenn.co1.qualtrics.com/CP/Graphic.php?IM=IM_bQlal1oB5kyb60m', count: 20 },
      ],
      shuffle: false,
    },
  ],
  timeline: [75, 125, 100, 125, 0],
  acceptedKeys: ['d', 'k'],
  totalTrials: 20,
  trialHtml: {
    width: 300,
    height: 300,
    text: '<b><i>d key = less pleasant</i></b>\n<b><i>k key = more pleasant</i></b>',
  }
}
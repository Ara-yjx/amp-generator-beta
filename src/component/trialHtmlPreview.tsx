import { Form, Select, Space, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { cloneDeep, isEqual } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import type { AmpParams, AmpStimuliItem, AmpTimeline, AT, ConcurrentDisplayFrame, DisplayLayout } from '../data/ampTypes';
import { renderATTrialHtml, renderTrialHtml } from '../data/renderTrialHtml';
import { forEach2d, getDisplayKey, map2d } from '../util/util';
import { StimuliThumbnail } from './stimuliThumbnail';

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;



type PreviewUids = { uid: number | 'empty', accuratePoint?: boolean }[][];
interface PreviewUidsSelector {
  previewUids: PreviewUids;
  updatePreviewUids: (previewUids: PreviewUids) => void;
}


const SinglePreviewSelector: React.FC<PreviewUidsSelector> = ({ previewUids, updatePreviewUids }) => {
  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const allItems = stimuliWatch.flatMap((stimuli, stimuliIndex) => (
    stimuli.items.map((item, itemIndex) => ({ ...item, indexDisplay: `${stimuliIndex + 1}-${itemIndex + 1}` }))
  ));

  const [uid, setUid] = useState<number | undefined>();


  const updateUid = (uid: number | undefined) => {
    setUid(uid);
    updatePreviewUids([[{ uid: uid ?? 'empty' }]]);
  }

  // If stimuli updates and the previewStimuliItem is deleted, reset previewStimuliItem
  const isUidValid = Boolean(allItems.find(x => x.uid === uid));
  useEffect(() => {
    if (!isUidValid) {
      updateUid(undefined);
    }
  }, [isUidValid]);


  return (
    <Space size='large'>
      <h3>Preview</h3>
      <Select
        placeholder='Select a stimuli item to preview'
        style={{ width: 300, height: 32 }}
        value={uid}
        onChange={updateUid}
        allowClear
      >
        {
          allItems.map((item) => (
            <Option key={item.uid} value={item.uid}>
              <StimuliThumbnail {...item} />
            </Option>
          ))
        }
      </Select>
    </Space>
  );
};


const ConcurrentPreviewSelector: React.FC<PreviewUidsSelector> = ({ previewUids, updatePreviewUids }) => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const [previewFrameIndex, setPreviewFrameIndex] = useState<number>();
  const concurrentDisplaysWatch = useWatch('timeline.concurrentDisplays', form) as ConcurrentDisplayFrame[];

  // When frameIndex becomes invalid, reset to undefined
  useEffect(() => {
    if (previewFrameIndex !== undefined && previewFrameIndex >= concurrentDisplaysWatch.length) {
      setPreviewFrameIndex(undefined);
    }
  }, [previewFrameIndex, concurrentDisplaysWatch.length]);

  // Layouted uids that fit the layout of selected frame
  const resizedUids = previewFrameIndex !== undefined && concurrentDisplaysWatch[previewFrameIndex] ? (
    map2d(concurrentDisplaysWatch[previewFrameIndex], (_, row, col) => previewUids[row]?.[col] ?? 'empty')
  ) : [[]];

  useEffect(() => {
    if (!isEqual(resizedUids, previewUids)) {
      updatePreviewUids(resizedUids);
    }
  });

  /** Update one uid in uidsRef */
  const updateOneUid = (row: number, col: number, uid: number | 'empty') => {
    const uidsClone = cloneDeep(resizedUids);
    uidsClone[row][col] = { uid };
    updatePreviewUids(uidsClone);
  };

  return (
    <>
      <h3>Preview</h3>

      <Select
        placeholder='Select a Display in the trial flow'
        style={{ width: 200, height: 32, marginBottom: 10 }}
        value={previewFrameIndex}
        onChange={setPreviewFrameIndex}
        options={concurrentDisplaysWatch.map((layout, index) => ({ label: `Display ${index + 1}`, value: index }))}
      />
      <Space size='large'>
        {
          previewFrameIndex !== undefined && concurrentDisplaysWatch[previewFrameIndex]?.map((row, rowIndex) => {
            return row.map((col, colIndex) => (

              <Form.Item layout='inline' label={getDisplayKey(rowIndex, colIndex)}>
                <Select
                  placeholder={col === 'empty' ? '(empty)' : undefined}
                  style={{ width: 160, height: 32 }}
                  disabled={col === 'empty'}
                  value={resizedUids[rowIndex][colIndex].uid}
                  onChange={uid => updateOneUid(rowIndex, colIndex, uid ?? 'empty')}
                >
                  {
                    col === 'empty' ? [] : stimuliWatch[col].items.map((item, itemIndex) => (
                      <Option key={item.uid} value={item.uid}>
                        <StimuliThumbnail {...item} indexDisplay={`${col + 1}-${itemIndex + 1}`} />
                      </Option>
                    ))
                  }
                </Select>
              </Form.Item>
            ));
          })
        }
      </Space>
    </>
  );
}


const AdvancedPreviewSelector: React.FC<PreviewUidsSelector> = ({ previewUids, updatePreviewUids }) => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const [previewFrameIndex, setPreviewFrameIndex] = useState<number>();
  const advancedTimelineWatch = useWatch('advancedTimeline', form) as AT.AdvancedTimeline;
  const selectedPage = typeof previewFrameIndex === 'number' ? advancedTimelineWatch.pages[previewFrameIndex] : undefined;
  const selectedPageLayoutedDisplays = selectedPage?.layoutedDisplays;

  useEffect(() => {
    if (previewFrameIndex !== undefined && previewFrameIndex >= advancedTimelineWatch.pages.length) {
      setPreviewFrameIndex(undefined);
    }
  }, [previewFrameIndex, advancedTimelineWatch.pages.length]);

  // Layouted uids that fit the layout and  of selected page
  const resizedUids = selectedPageLayoutedDisplays ? map2d(selectedPageLayoutedDisplays, (selectedPageDisplayItem, row, col) => ({
    uid: previewUids[row]?.[col]?.uid ?? 'empty',
    accuratePoint: selectedPage.response.mouseClick.enabled && selectedPageDisplayItem.mouseClickAccuratePoint,
  })) : [[]];

  useEffect(() => {
    if (!isEqual(resizedUids, previewUids)) {
      updatePreviewUids(resizedUids);
    }
  });

  /** Update one uid in uidsRef */
  const updateOneUid = (row: number, col: number, uid: number | 'empty') => {
    const accuratePoint = selectedPage?.response.mouseClick.enabled && selectedPage.layoutedDisplays[row][col].mouseClickAccuratePoint;
    const uidsClone = cloneDeep(resizedUids);
    uidsClone[row][col] = { uid, accuratePoint };
    updatePreviewUids(uidsClone);
  };


  const AdvancedPreviewSelectorItem: React.FC<{
    item: AT.LayoutedDisplayItem;
    row: number;
    col: number;
  }> = ({ item, row, col }) => {
    const { displaySrc } = item;
    const thisSelectorValue = resizedUids[row][col].uid;
    // When displaySrc is blank, reset selected uid to 'empty'
    useEffect(() => {
      if (displaySrc[0] === 'blank' && thisSelectorValue !== 'empty') {
        updateOneUid(row, col, 'empty');
      }
    });
    const optionItems = Boolean(displaySrc[0] === 'pool') && stimuliWatch[displaySrc[1] as number].items || undefined;
    // When current uid is not in option list, reset to 'empty'
    const optionUids = optionItems?.map(x => x.uid);
    useEffect(() => {
      if (thisSelectorValue !== 'empty' && !optionUids?.includes(thisSelectorValue)) {
        updateOneUid(row, col, 'empty');
      }
    }, []);
    return (
      <Form.Item label={getDisplayKey(row, col)}>
        <Select
          placeholder={displaySrc[0] === 'blank' ? '(empty)' : undefined}
          style={{ width: 200, height: 32 }}
          disabled={displaySrc[0] === 'blank'}
          value={thisSelectorValue}
          onChange={uid => updateOneUid(row, col, uid ?? 'empty')}
        >
          {
            optionItems?.map((item, itemIndex) => (
              <Option key={item.uid} value={item.uid}>
                <StimuliThumbnail {...item} indexDisplay={`${(displaySrc[1] as number) + 1}-${itemIndex + 1}`} />
              </Option>
            ))
          }
        </Select>
      </Form.Item>
    );
  }

  return (
    <>
      <h3>Preview</h3>

      <Select
        placeholder='Select a Page in the trial flow'
        style={{ width: 200, height: 32, marginBottom: 10 }}
        value={previewFrameIndex}
        onChange={setPreviewFrameIndex}
        options={advancedTimelineWatch.pages.map((page, index) => ({ label: `Page ${index + 1}`, value: index }))}
      />
      <Space size='large'>
        {
          selectedPageLayoutedDisplays && map2d(selectedPageLayoutedDisplays, (item, row, col) => <AdvancedPreviewSelectorItem item={item} row={row} col={col} key={`${row}.${col}`} />)
        }
      </Space>
    </>
  );
}

export const TrialHtmlPreview: React.FC = () => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const trialTypeWatch = useWatch('trialType', form) as AmpParams['trialType'];

  const previewRef = useRef<HTMLIFrameElement>(null);
  const trialHtmlWatch = useWatch('trialHtml', form) as AmpParams['trialHtml'];
  const advancedTimelineWatch = useWatch('advancedTimeline', form) as AmpParams['advancedTimeline'];
  const concurrentDisplaysWatch = useWatch('timeline.concurrentDisplays', form) as AmpTimeline['concurrentDisplays'];
  const previewInnerHtml = trialHtmlWatch.customHtml ?? (
    advancedTimelineWatch ? renderATTrialHtml(trialHtmlWatch, advancedTimelineWatch) : renderTrialHtml(trialHtmlWatch, concurrentDisplaysWatch)
  );

  const [previewUids, setPreviewUids] = useState<PreviewUids>([[]]);

  const renderPreview = () => {
    const previewStimuliItems = map2d(previewUids, ({ uid, accuratePoint }) => {
      if (uid === 'empty') {
        return { type: 'empty', content: '', accuratePoint } as const;
      } else if (typeof uid === 'number') {
        const stimuliOfUid = stimuliWatch.flatMap(stimuli => stimuli.items).find(i => i.uid === uid);
        return stimuliOfUid ? { ...stimuliOfUid, accuratePoint } : { type: 'empty', content: '', accuratePoint } as const;
      } else {
        return null;
      }
    });
    renderTrialPreview(previewRef, previewInnerHtml, previewStimuliItems, trialHtmlWatch.darkMode);
  };
  useEffect(renderPreview);


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} >
      {
        trialTypeWatch === 'advanced' && advancedTimelineWatch ? <AdvancedPreviewSelector previewUids={previewUids} updatePreviewUids={setPreviewUids} /> :
          concurrentDisplaysWatch ? <ConcurrentPreviewSelector previewUids={previewUids} updatePreviewUids={setPreviewUids} /> :
            <SinglePreviewSelector previewUids={previewUids} updatePreviewUids={setPreviewUids} />
      }

      <iframe style={{ flexGrow: 1 }} ref={previewRef} height={700} title='HTML Preview'></iframe>
      <Text type='secondary'>(The grey border of content area will not be visible in the generated survey.)</Text>
    </div >
  )
}


// const QUALTRICS_DEFAULT_SKIN = {
//   fontSize: '24',
//   fontWeight: '400',
//   fontFamily: 'Poppins,Arial,sans-serif',
//   color: '#757575',
//   lineHeight: '1.5em',
// } as const; // as Partial<CSSStyleDeclaration>;



// @font-face {
//   font-family: Poppins;
//   src: url(/fonts/poppinslight.ttf);
//   font-style: normal;
//   font-weight: 400
// }
// @font-face {
//   font-family: Poppins;
//   src: url(/fonts/poppinslight.ttf);
//   font-style: italic;
//   font-weight: 400
// }
const QUALTRICS_STYLE = `
body {
  font-size: 24px;
  font-weight: 400px;
  font-family: Poppins,Arial,sans-serif;
  color: #757575;
  line-height: 1.5em;
}
/* For visibility in preview */
.spt-trial-content {
  border: 1px solid grey;
}
`;

type StimuliItemToDisplay = { type: AmpStimuliItem['type'] | 'empty', content: string, accuratePoint?: boolean } | null;

function renderTrialPreview(
  previewRef: React.MutableRefObject<HTMLIFrameElement | null>,
  previewInnerHtml: string,
  previewStimuliItems: StimuliItemToDisplay[][],
  darkMode: boolean,
) {
  const iframeDocument = previewRef.current?.contentDocument;
  if (iframeDocument) {
    // Set style once 
    if (!iframeDocument.getElementById('preview-style')) {
      const styleEl = iframeDocument.createElement('style');
      styleEl.id = 'preview-style';
      styleEl.appendChild(iframeDocument.createTextNode(QUALTRICS_STYLE));
      iframeDocument.head.appendChild(styleEl);
    }
    // Set body html
    iframeDocument.body.innerHTML = previewInnerHtml;
    // Simulate mode page background
    iframeDocument.body.style.backgroundColor = darkMode ? 'black' : 'initial';
    // Simulate stimuli preview
    iframeDocument && simulateDisplay(previewStimuliItems, iframeDocument);
  }
}

/** Copied form trial.js */
function simulateDisplay(stimuliItems: StimuliItemToDisplay[][], container: Document) {
  console.debug('simulateDisplay', stimuliItems);
  simulateClear(container);
  forEach2d(stimuliItems, (stimuliItem, row, col) => {
    const key = getDisplayKey(row, col);
    const contentEl = container.querySelector<HTMLDivElement>('.spt-trial-content.spt-trial-content-' + key);
    if (contentEl) {
      if (stimuliItem !== null) {
        if (stimuliItem.type === 'text') {
          const textEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-text');
          if (textEl) {
            textEl.style.display = '';
            textEl.innerHTML = stimuliItem.content;
          }
        } else if (stimuliItem.type === 'image') {
          const imageEl = contentEl.querySelector<HTMLImageElement>('.spt-trial-image');
          if (imageEl) {
            imageEl.style.display = '';
            imageEl.src = stimuliItem.content;
          }
        } else if (stimuliItem.type === 'button') {
          const buttonEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-button');
          if (buttonEl) {
            buttonEl.style.display = '';
            buttonEl.innerHTML = stimuliItem.content || ' '; // at least show button outline
          }
        }
        if (stimuliItem.accuratePoint) {
          const accuratePointEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-accurate-point');
          if (accuratePointEl) {
            accuratePointEl.style.display = '';
          }
        }
      }
      contentEl.style.display = 'flex';
    }
  });
}
function simulateClear(container: Document) {
  container.querySelectorAll<HTMLDivElement>('.spt-trial-content').forEach(contentEl => {
    const previewEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-preview');
    if (previewEl) {
      previewEl.style.display = 'none';
    }
    const textEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-text');
    if (textEl) {
      textEl.style.display = 'none';
      textEl.innerHTML = '';
    }
    const imageEl = contentEl.querySelector<HTMLImageElement>('.spt-trial-image');
    if (imageEl) {
      imageEl.style.display = 'none';
      imageEl.src = '';
    }
    const buttonEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-button');
    if (buttonEl) {
      buttonEl.style.display = 'none';
      buttonEl.innerHTML = '';
    }
    contentEl.style.display = 'none';
  })
}
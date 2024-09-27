import { Form, Select, Space, Typography } from "@arco-design/web-react";
import useFormContext from "@arco-design/web-react/es/Form/hooks/useContext";
import useWatch from "@arco-design/web-react/es/Form/hooks/useWatch";
import { cloneDeep } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import type { AmpParams, AmpTimeline, AT, ConcurrentDisplayFrame } from "../data/ampTypes";
import { getATUniversalLayout, getCDUniversalLayout, getElementPoolMappingOfLayout, renderATTrialHtml, renderTrialHtml } from "../data/renderTrialHtml";
import { getDisplayKey, getLayoutFromLayoutDisplays } from "../util/util";
import { StimuliThumbnail } from "./stimuliThumbnail";

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;


interface RenderPreviewFunction {
  (uids: (number | 'empty' | null)[]): void;
}


const SinglePreviewSelector: React.FC<{ onUidsChange: RenderPreviewFunction }> = ({ onUidsChange }) => {
  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const allItems = stimuliWatch.flatMap((stimuli, stimuliIndex) => (
    stimuli.items.map((item, itemIndex) => ({ ...item, indexDisplay: `${stimuliIndex + 1}-${itemIndex + 1}` }))
  ));

  const [uid, setUid] = useState<number | undefined>();


  const updateUid = (uid: number | undefined) => {
    setUid(uid);
    onUidsChange([uid ?? null]);
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


const ConcurrentPreviewSelector: React.FC<{ onUidsChange: RenderPreviewFunction }> = ({ onUidsChange }) => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const concurrentDisplaysWatch = useWatch('timeline.concurrentDisplays', form) as ConcurrentDisplayFrame[];
  const universalLayout = getCDUniversalLayout(concurrentDisplaysWatch);

  // stimuli items to display (by uid)
  // same structure as selected display. 'undefined' means empty (no selected stimuli item to display)
  const [uids, setUids] = useState<(number | undefined)[][]>(() => concurrentDisplaysWatch[previewFrameIndex].map(row => row.map(col => undefined)));

  // should be called manually when uids change
  const watchUids = (uids: (number | undefined)[][]) => {
    const heteroMapping: (number | 'empty' | null)[][] = getElementPoolMappingOfLayout(universalLayout, null);
    uids.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        heteroMapping[rowIndex][colIndex] = col ?? 'empty'; // turn 'undefined' to empty
      });
    });
    onUidsChange(heteroMapping.flat());
  }

  /** Reset to same structure as the elementPoolMapping of selected frame */
  const resetUids = () => {
    console.log('resetUids')
    const newUids = concurrentDisplaysWatch[previewFrameIndex].map(row => row.map(col => undefined))
    setUids(newUids);
    watchUids(newUids);
  };

  // Reset when layout change of display index change
  useEffect(resetUids, [JSON.stringify(getCDUniversalLayout([concurrentDisplaysWatch[previewFrameIndex]]))]);

  /** Update one uid in uidsRef */
  const updateOneUid = (row: number, col: number, uid: number | undefined) => {
    const uidsClone = cloneDeep(uids);
    uidsClone[row][col] = uid;
    setUids(uidsClone);
    watchUids(uidsClone);
  };

  const onFrameIndexSelectorChange = (newIndex: number) => {
    setPreviewFrameIndex(newIndex);
    resetUids();
  };

  return (
    <>
      <h3>Preview</h3>

      <Select
        placeholder='Select a Display in the trial flow'
        style={{ width: 200, height: 32, marginBottom: 10 }}
        value={previewFrameIndex}
        onChange={onFrameIndexSelectorChange}
        options={concurrentDisplaysWatch.map((layout, index) => ({ label: `Display ${index + 1}`, value: index }))}
      />
      <Space size='large'>

        {
          concurrentDisplaysWatch[previewFrameIndex].map((row, rowIndex) => {

            return row.map((col, colIndex) => (

              <Form.Item layout='inline' label={getDisplayKey(rowIndex, colIndex)}>
                <Select
                  placeholder={col === 'empty' ? '(empty)' : undefined}
                  style={{ width: 160, height: 32 }}
                  disabled={col === 'empty'}
                  value={uids[rowIndex]?.[colIndex]}
                  onChange={uid => updateOneUid(rowIndex, colIndex, uid)}
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


const AdvancedPreviewSelector: React.FC<{ onUidsChange: RenderPreviewFunction }> = ({ onUidsChange }) => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const advancedTimelineWatch = useWatch('advancedTimeline', form) as AT.AdvancedTimeline;

  const universalLayout = getATUniversalLayout(advancedTimelineWatch);

  const selectedPage = advancedTimelineWatch.pages[previewFrameIndex];

  const getDefaultUids = () => {
    return selectedPage.layoutedDisplays.map(row => row.map(col => undefined)) ?? [[]];
  };

  // stimuli items to display (by uid)
  // same structure as selected display. 'undefined' means empty (no selected stimuli item to display)
  const [uids, setUids] = useState<(number | undefined)[][]>(getDefaultUids);

  // should be called manually when uids change
  const watchUids = (uids: (number | undefined)[][]) => {
    const heteroMapping: (number | 'empty' | null)[][] = getElementPoolMappingOfLayout(universalLayout, null);
    uids.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        heteroMapping[rowIndex][colIndex] = col ?? 'empty'; // turn 'undefined' to empty
      });
    });
    onUidsChange(heteroMapping.flat());
  }

  /** Reset to same structure as the elementPoolMapping of selected frame */
  const resetUids = () => {
    console.log('resetUids')
    const newUids = getDefaultUids();
    setUids(newUids);
    watchUids(newUids);
  };

  // Reset when layout change of display index change
  useEffect(resetUids, [JSON.stringify(getLayoutFromLayoutDisplays(selectedPage.layoutedDisplays))]);

  /** Update one uid in uidsRef */
  const updateOneUid = (row: number, col: number, uid: number | undefined) => {
    const uidsClone = cloneDeep(uids);
    uidsClone[row][col] = uid;
    setUids(uidsClone);
    watchUids(uidsClone);
  };

  const onFrameIndexSelectorChange = (newIndex: number) => {
    setPreviewFrameIndex(newIndex);
    resetUids();
  };

  return (
    <>
      <h3>Preview</h3>

      <Select
        placeholder='Select a Page in the trial flow'
        style={{ width: 200, height: 32, marginBottom: 10 }}
        value={previewFrameIndex}
        onChange={onFrameIndexSelectorChange}
        options={advancedTimelineWatch.pages.map((page, index) => ({ label: `Page ${index + 1}`, value: index }))}
      />
      <Space size='large'>
        {
          selectedPage.layoutedDisplays.map((row, rowIndex) => {
            return row.map(({ displaySrc }, colIndex) => (
              <Form.Item label={`Row${rowIndex + 1}-Col${colIndex + 1}`}>
                <Select
                  placeholder={displaySrc[0] === 'blank' ? '(empty)' : displaySrc[0] === 'copy' ? '(copy)' : undefined}
                  style={{ width: 200, height: 32 }}
                  disabled={displaySrc[0] === 'blank' || displaySrc[0] === 'copy'}
                  value={uids[rowIndex]?.[colIndex]}
                  onChange={uid => updateOneUid(rowIndex, colIndex, uid)}
                >
                  {
                    Boolean(displaySrc[0] === 'pool') && stimuliWatch[displaySrc[1] as number].items.map((item, itemIndex) => (
                      <Option key={item.uid} value={item.uid}>
                        <StimuliThumbnail {...item} indexDisplay={`${(displaySrc[1] as number) + 1}-${itemIndex + 1}`} />
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

export const TrialHtmlPreview: React.FC = () => {

  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];

  const previewRef = useRef<HTMLIFrameElement>(null);
  const trialHtmlWatch = useWatch('trialHtml', form) as AmpParams['trialHtml'];
  const advancedTimelineWatch = useWatch('advancedTimeline', form) as AmpParams['advancedTimeline'];
  const concurrentDisplaysWatch = useWatch('timeline.concurrentDisplays', form) as AmpTimeline['concurrentDisplays'];
  const previewInnerHtml = trialHtmlWatch.customHtml ?? (
    advancedTimelineWatch ? renderATTrialHtml(trialHtmlWatch, advancedTimelineWatch) : renderTrialHtml(trialHtmlWatch, concurrentDisplaysWatch)
  );

  const [uids, setUids] = useState<(number | 'empty' | null)[]>([]);

  const renderPreview = () => {
    console.log('renderPreview', uids)
    const previewStimuliItems = uids.map(uid => {
      if (uid === 'empty') {
        return { type: 'empty', content: '' } as const;
      } else if (typeof uid === 'number') {
        return stimuliWatch.flatMap(stimuli => stimuli.items).find(i => i.uid === uid) ?? { type: 'empty', content: '' } as const;
      } else {
        return null;
      }
    });
    renderTrialPreview(previewRef, previewInnerHtml, previewStimuliItems, trialHtmlWatch.darkMode)
  };
  useEffect(renderPreview);


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} >
      {
        advancedTimelineWatch ? <AdvancedPreviewSelector onUidsChange={setUids} /> :
          concurrentDisplaysWatch ? <ConcurrentPreviewSelector onUidsChange={setUids} /> :
            <SinglePreviewSelector onUidsChange={setUids} />
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

type StimuliItemToDisplay = { type: 'image' | 'text' | 'empty', content: string } | null;

function renderTrialPreview(
  previewRef: React.MutableRefObject<HTMLIFrameElement | null>,
  previewInnerHtml: string,
  previewStimuliItems: StimuliItemToDisplay[],
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
function simulateDisplay(stimuliItems: StimuliItemToDisplay[], container: Document) {
  simulateClear(container);
  stimuliItems.forEach((stimuliItem, index) => {
    const contentEl = container.querySelector<HTMLDivElement>('.spt-trial-content.spt-trial-content-' + (index + 1));
    if (contentEl) {
      if (stimuliItem !== null) {
        const textEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-text');
        const imageEl = contentEl.querySelector<HTMLImageElement>('.spt-trial-image');
        if (stimuliItem.type === 'text') {
          if (textEl) textEl.style.visibility = '';
          if (textEl) textEl.innerHTML = stimuliItem.content;
          if (imageEl) imageEl.style.visibility = 'hidden';
          if (imageEl) imageEl.src = '';
        } else if (stimuliItem.type === 'image') {
          if (textEl) textEl.style.visibility = 'hidden';
          if (textEl) textEl.innerHTML = '';
          if (imageEl) imageEl.style.visibility = '';
          if (imageEl) imageEl.src = stimuliItem.content;
        }
        contentEl.style.display = '';
      }
    }
  })
}
function simulateClear(container: Document) {
  (container.querySelectorAll<HTMLDivElement>('.spt-trial-content')).forEach(contentEl => {
    const textEl = contentEl.querySelector<HTMLDivElement>('.spt-trial-text');
    const imageEl = contentEl.querySelector<HTMLImageElement>('.spt-trial-image');
    if (textEl) textEl.style.visibility = 'hidden';
    if (textEl) textEl.innerHTML = '';
    if (imageEl) imageEl.style.visibility = 'hidden';
    if (imageEl) imageEl.src = '';
    contentEl.style.display = 'none';
  })
}
import { sum, range, max } from 'lodash';
import { getDisplayKey, getLayoutFromLayoutDisplays } from '../util/util';
import { AmpTimeline, AmpTrialHtml, AT, DisplayLayout } from './ampTypes';

export function getATUniversalLayout(advancedTimeline: AT.AdvancedTimeline): DisplayLayout {
  return getUniversalLayout(advancedTimeline.pages.map(page => getLayoutFromLayoutDisplays(page.layoutedDisplays)));
}

export function getCDUniversalLayout(concurrentDisplays: AmpTimeline['concurrentDisplays']): DisplayLayout {
  return concurrentDisplays ? getUniversalLayout(concurrentDisplays.map(display => display.map(x => x.length))) : [1];
}

export function getUniversalLayout(layouts: DisplayLayout[]): DisplayLayout {
  if (layouts.length === 0) {
    return [1];
  }
  const numOfRows = Math.max(...layouts.map(layout => layout.length));
  return range(numOfRows).map(rowIndex => (
    // max num of col for this fow
    Math.max(...layouts.map(layout => (
      layout.length > rowIndex ? layout[rowIndex] : 0
    )))
  ));
}

export function getIndexInLayoutByRowCol(row: number, col: number, layout: number[]) {
  return sum(layout.slice(0, row)) + col;
}

export function getElementPoolMappingOfLayout<T = null>(layout: number[], fillWith: T): T[][] {
  return layout.map(row => Array(row).fill(fillWith));
}

function renderItem(props: AmpTrialHtml, rowIndex: number, colIndex: number) {
  return trim(`
    <!-- Item -->
    <div class="spt-trial-content spt-trial-content-${getDisplayKey(rowIndex, colIndex)}" style="margin-left: ${props.concurrentHorizontalGap ?? 0}px; width: ${props.width}px; height: ${props.height}px; position: relative; display: flex; justify-content: center; align-items: center; text-align: center;" data-spt-visible-display="flex">
      <img class="spt-trial-image" style="width: 100%; height: 100% !important; object-fit: contain; display: none;"/>
      <div class="spt-trial-text" style="width: 100%; height: 100%; white-space: ${props.textWrap ? 'pre-line' : 'pre'}; overflow-wrap: break-word; color: ${props.textColor ?? 'auto'}; font-weight: ${props.textIsBold ? 'bold' : 'normal'}; font-size: ${props.textFontSize}px; line-height: 1.5em; display: none;"></div>
      <video class="spt-trial-video" style="width: 100%; height: 100%; object-fit: contain; display: none;" preload="auto" autoplay loop></video>
      <div class="spt-trial-button" style="max-width: 100%; white-space: 'pre-line'; overflow-wrap: break-word; color: #000; font-size: 20px; line-height: 1.2em; border: 1px solid #000; border-radius: 4px; background-color: #f3f3f3; padding: 0 4px; cursor: pointer; display: none;" onmouseenter="this.style.boxShadow='0 0 4px 0 #ccc'" onmouseleave="this.style.boxShadow=''"></div>
      <div class="spt-trial-accurate-point" style="position: absolute; bottom: -30px; width: 15px; height: 15px; border: 1px solid #000; border-radius: 50%; background-color: #f3f3f3; display: none;" onmouseenter="this.style.boxShadow='0 0 4px 0 #ccc'" onmouseleave="this.style.boxShadow=''"></div>
    </div>
  `);
}

/** 
 * @param numOfCols Number of cols in this row
 * @param numOfPrevCols The total count of items in the previous rows, which is also the item index of the first col in this row 
 */
function renderRow(props: AmpTrialHtml, numOfCols: number, rowIndex: number) {
  return trim(`
  <!-- Row -->
  <div style="display: flex; justify-content: center; align-items: center; margin-top: ${props.concurrentVerticalGap ?? 0}px; margin-left: ${-(props.concurrentHorizontalGap ?? 0)}px;">
${range(numOfCols).map(colIndex => renderItem(props, rowIndex, colIndex)).join('\n')}
  </div>
  `);
}


// Todo: consider merging renderTrialHtml and renderATTrialHtml
export function renderTrialHtml(props: AmpTrialHtml, concurrentDisplays: AmpTimeline['concurrentDisplays']) {
  return renderTrialHtmlForLayout(props, getCDUniversalLayout(concurrentDisplays));
}

export function renderATTrialHtml(props: AmpTrialHtml, advancedTimeline: AT.AdvancedTimeline) {
  const additionalContainerHeight = max(advancedTimeline.pages.map(page => page.style?.containerTopBlank ?? 0));
  return renderTrialHtmlForLayout(props, getATUniversalLayout(advancedTimeline), additionalContainerHeight);
} 

export function renderTrialHtmlForLayout(props: AmpTrialHtml, layout: number[], additionalContainerHeight = 0) {
  const containerHeight = (props.height + (props.concurrentVerticalGap ?? 0)) * layout.length + additionalContainerHeight;
  return trim(`
<!-- Container. Fixed-height so that the instruction won't move. Flex prevents margin collapse with external. -->
<div class="spt-trial-container" style="height: ${containerHeight}px; box-sizing: content-box; padding-top: ${props.marginTop ?? 0}px;">
<div class="spt-trial-container-inner" style="display: flex; flex-direction: column; margin-top: ${-(props.concurrentVerticalGap ?? 0)}px;">
${layout.map((numOfCols, rowIndex) => renderRow(props, numOfCols, rowIndex)).join('\n')}
</div>
</div>
<!-- Instruction -->
<div style="display: flex; justify-content: space-around; margin-top: 6em; white-space: pre-wrap; color: ${props.darkMode ? 'white' : 'black'}; text-align: center">${props.instruction}</div>
`);
}

/** Remove newline at head and tail, and all spaces at tail */
function trim(s: string) {
  return s.replace(/^\n/, '').replace(/\n +$/, '');
}

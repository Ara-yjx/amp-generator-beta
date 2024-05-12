import range from 'lodash/range';
import { AmpTimeline, AmpTrialHtml } from './ampTypes';
import { sum } from 'lodash';

/** Get minimum layout that can fit all trial displays */
export function getUniversalLayout(concurrentDisplays: AmpTimeline['concurrentDisplays']): number[] {
  if (concurrentDisplays === undefined) return [1];
  const numOfRows = Math.max(...concurrentDisplays.map(layout => layout.length));
  const maxColOfEachRow = range(numOfRows).map(rowIndex => (
    Math.max(...concurrentDisplays.map(layout => layout.length > rowIndex ? layout[rowIndex].length : 1))
  ));
  return maxColOfEachRow;
}

export function getIndexInLayoutByRowCol(row: number, col: number, layout: number[]) {
  return sum(layout.slice(0, row)) + col;
}

export function getElementPoolMappingOfLayout<T = null>(layout: number[], fillWith: T): T[][] {
  return layout.map(row => Array(row).fill(fillWith));
}

function renderItem(params: AmpTrialHtml, index: number) {
  return `
        <!-- Item -->
          <div class="spt-trial-content" id="spt-trial-content-${index + 1}" style="margin-left: ${params.concurrentHorizontalGap ?? 0}px; width: ${params.width}px; height: ${params.height}px; position: relative;">
          <div class="spt-trial-text" style="position: absolute; width: 100%; height: 100%; white-space: ${params.textWrap ? 'pre-line' : 'pre'}; color: ${params.textColor ?? 'auto'}; font-weight: ${params.textIsBold ? 'bold' : 'normal'}; font-size: ${params.textFontSize}px; line-height: 1.5em; text-align: center;"></div>
          <img class="spt-trial-image" style="position: absolute; width: 100%; height: 100%; object-fit: contain;"/>
        </div>
  `;
}

/** @param itemIndex The item index of the first col in this row, which is also the # of items in the previous rows */
function renderRow(params: AmpTrialHtml, numOfCols: number, itemIndex: number) {
  return `
      <!-- Row, also wrapper for items -->
      <div style="margin-top: ${params.concurrentVerticalGap ?? 0}px; margin-left: ${-(params.concurrentHorizontalGap ?? 0)}px; display: flex; flex-direction: row; justify-content: center; align-items: center;">
        ${range(numOfCols).map(colIndex => renderItem(params, itemIndex + colIndex)).join('')}
      </div>
  `;
}

export function renderTrialHtml(params: AmpTrialHtml, concurrentDisplays: AmpTimeline['concurrentDisplays'], layout?: number[]) {
  const renderLayout = layout ?? getUniversalLayout(concurrentDisplays);
  const containerHeight = params.height * renderLayout.length + (params.concurrentVerticalGap ?? 0) * (renderLayout.length - 1);
  return `
<!-- Container. Fixed-height so that the instruction won't move. Use padding to prevent internal margin collapse with external -->
<div style="height: ${containerHeight}px; padding-top: ${params.marginTop}px; box-sizing: content-box;">
  <!-- Wrapper for rows to implement 'gap' -->
  <div style="margin-top: ${-(params.concurrentVerticalGap ?? 0)}px;">
    ${(() => {
      let result = '', itemIndex = 0;
      for (const numOfCols of renderLayout) {
        result += renderRow(params, numOfCols, itemIndex);
        itemIndex += numOfCols;
      }
      return result;
    })()}
  </div>
</div>
<div style="display: flex; justify-content: space-around; margin-top: 6em; white-space: pre-wrap; color: ${params.darkMode ? 'white' : 'black'}; text-align: center">${params.instruction}</div>
`
}

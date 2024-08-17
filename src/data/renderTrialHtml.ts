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
  return trim(`
    <!-- Item -->
    <div class="spt-trial-content spt-trial-content-${index + 1}" style="margin-left: ${params.concurrentHorizontalGap ?? 0}px; width: ${params.width}px; height: ${params.height}px; position: relative;">
      <img class="spt-trial-image" style="position: absolute; width: 100%; height: 100%; object-fit: contain;"/>
      <div class="spt-trial-text" style="position: absolute; width: 100%; height: 100%; white-space: ${params.textWrap ? 'pre-line' : 'pre'}; color: ${params.textColor ?? 'auto'}; font-weight: ${params.textIsBold ? 'bold' : 'normal'}; font-size: ${params.textFontSize}px; line-height: 1.5em; display: flex; justify-content: center; align-items: center;"></div>
    </div>
  `);
}

/** 
 * @param numOfCols Number of cols in this row
 * @param numOfPrevCols The total count of items in the previous rows, which is also the item index of the first col in this row 
 */
function renderRow(params: AmpTrialHtml, numOfCols: number, numOfPrevCols: number) {
  return trim(`
  <!-- Row -->
  <div style="display: flex; justify-content: center; align-items: center; margin-top: ${params.concurrentVerticalGap ?? 0}px; margin-left: ${-(params.concurrentHorizontalGap ?? 0)}px;">
${range(numOfCols).map(colIndex => renderItem(params, numOfPrevCols + colIndex)).join('\n')}
  </div>
  `);
}

export function renderTrialHtml(params: AmpTrialHtml, concurrentDisplays: AmpTimeline['concurrentDisplays']) {
  const layout = getUniversalLayout(concurrentDisplays);
  const containerHeight = (params.height + (params.concurrentVerticalGap ?? 0)) * layout.length;
  return trim(`
<!-- Container. Fixed-height so that the instruction won't move. Flex prevents margin collapse with external. -->
<div style="display: flex; flex-direction: column; height: ${containerHeight}px; box-sizing: content-box; padding-top: ${params.marginTop ?? 0}px; margin-top: ${-(params.concurrentVerticalGap ?? 0)}px;">
${(() => {
  let rows = [], numOfPrevCols = 0;
  for (const numOfCols of layout) {
    rows.push(renderRow(params, numOfCols, numOfPrevCols));
    numOfPrevCols += numOfCols;
  }
  return rows.join('\n');
})()}
</div>
<!-- Instruction -->
<div style="display: flex; justify-content: space-around; margin-top: 6em; white-space: pre-wrap; color: ${params.darkMode ? 'white' : 'black'}; text-align: center">${params.instruction}</div>
`);
}

/** Remove newline at head and tail, and all spaces at tail */
function trim(s: string) {
  return s.replace(/^\n/, '').replace(/\n +$/, '');
}

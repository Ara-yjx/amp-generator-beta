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

function renderItem(props: AmpTrialHtml, index: number) {
  return trim(`
    <!-- Item -->
    <div class="spt-trial-content spt-trial-content-${index + 1}" style="margin-left: ${props.concurrentHorizontalGap ?? 0}px; width: ${props.width}px; height: ${props.height}px; position: relative;">
      <img class="spt-trial-image" style="position: absolute; width: 100%; height: 100%; object-fit: contain;"/>
      <div class="spt-trial-text" style="position: absolute; width: 100%; height: 100%; white-space: ${props.textWrap ? 'pre-line' : 'pre'}; color: ${props.textColor ?? 'auto'}; font-weight: ${props.textIsBold ? 'bold' : 'normal'}; font-size: ${props.textFontSize}px; line-height: 1.5em; display: flex; justify-content: center; align-items: center;"></div>
    </div>
  `);
}

/** 
 * @param numOfCols Number of cols in this row
 * @param numOfPrevCols The total count of items in the previous rows, which is also the item index of the first col in this row 
 */
function renderRow(props: AmpTrialHtml, numOfCols: number, numOfPrevCols: number) {
  return trim(`
  <!-- Row -->
  <div style="display: flex; justify-content: center; align-items: center; margin-top: ${props.concurrentVerticalGap ?? 0}px; margin-left: ${-(props.concurrentHorizontalGap ?? 0)}px;">
${range(numOfCols).map(colIndex => renderItem(props, numOfPrevCols + colIndex)).join('\n')}
  </div>
  `);
}

export function renderTrialHtml(props: AmpTrialHtml, concurrentDisplays: AmpTimeline['concurrentDisplays']) {
  return renderTrialHtmlForLayout(props, getUniversalLayout(concurrentDisplays));
}

export function renderTrialHtmlForLayout(props: AmpTrialHtml, layout: number[]) {
  const containerHeight = (props.height + (props.concurrentVerticalGap ?? 0)) * layout.length;
  return trim(`
<!-- Container. Fixed-height so that the instruction won't move. Flex prevents margin collapse with external. -->
<div style="display: flex; flex-direction: column; height: ${containerHeight}px; box-sizing: content-box; padding-top: ${props.marginTop ?? 0}px; margin-top: ${-(props.concurrentVerticalGap ?? 0)}px;">
${(() => {
  let rows = [], numOfPrevCols = 0;
  for (const numOfCols of layout) {
    rows.push(renderRow(props, numOfCols, numOfPrevCols));
    numOfPrevCols += numOfCols;
  }
  return rows.join('\n');
})()}
</div>
<!-- Instruction -->
<div style="display: flex; justify-content: space-around; margin-top: 6em; white-space: pre-wrap; color: ${props.darkMode ? 'white' : 'black'}; text-align: center">${props.instruction}</div>
`);
}

/** Remove newline at head and tail, and all spaces at tail */
function trim(s: string) {
  return s.replace(/^\n/, '').replace(/\n +$/, '');
}

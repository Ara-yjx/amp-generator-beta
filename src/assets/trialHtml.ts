export const TRIAL_TEMPLATE = 
`<div style="background-color: {{backgroundColor}}; padding: {{marginTop}}px;">
  <div style="margin: 0 auto; width: {{width}}px; height: {{height}}px; display: flex; align-items: center; justify-content: center; position: relative;">
    <div id="spt-trial-text" style="white-space: {{textWrap}}; color: {{textColor}}; font-weight: {{textFontWeight}}; font-size: {{textFontSize}}px; line-height: 1.5em; text-align: center;"></div>
    <img id="spt-trial-image" style="position: absolute; width: 100%; height: 100%; object-fit: contain;"/>
  </div>
  <div style="display: flex; justify-content: space-around; margin-top: 6em; white-space: pre-wrap; color: {{instructionColor}}; text-align: center">{{instruction}}</div>
</div>`
;

import React from 'react';

import { Divider, Form, Space, Switch, Tooltip, Typography } from '@arco-design/web-react';
import { IconQuestionCircle } from '@arco-design/web-react/icon';

const { Item } = Form;
const { Text } = Typography;

/** field: advancedTimeline.pages[*].swap */
export const SwapSwitch: React.FC<{ field: string }> = ({ field }) => {
  return (
    <Space style={{ margin: '10px 0', width: '100%' }}>
      <Item field={field} triggerPropName='checked' noStyle>
        <Switch />
      </Item>
      <Text bold>Swap (shuffle) displays</Text>
      <Tooltip position='right' content={
        <div >
          {field}
          <li>You can randomly swap display items, switching their position in the screen.</li>
          <Divider />
          <li>
            But in some scenerio when you enable "Swap" + "Keyboard response",
            you want each key to be bound to the stimuli at specific position.
            (E.g. you tell the participant to press "d" to select the left stimuli which comes from Pool 1, and "k" to select the right stimuli which comes from Pool 2.)
            <br />
            Then you may want to reverse the swap to get the participant's actual selection.
            You can do this by binding key(s) to stimuli item.
            (E.g. although stimuli from Pool 1 is displayed at the right position after swapping,
            and user pressed "k" to select it,
            the result will be reversed to "d" in the response.)
          </li>
          <li>Each swapped display item must have at least one bind-key, and the bind-keys of different display items must be distinct.</li>
        </div>
      }>
        <IconQuestionCircle />
      </Tooltip>
    </Space>
  )
};

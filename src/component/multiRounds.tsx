import React from 'react';
import { Form, InputNumber, Space, Switch, Tooltip, Typography } from '@arco-design/web-react';
import { IconQuestionCircle } from '@arco-design/web-react/icon';

const { Item } = Form;

export const MultiRounds: React.FC<{}> = ({ }) => {
  const { form } = Form.useFormContext();
  const totalRoundsWatch = Form.useWatch('totalRounds', form);
  const isMultiRounds = totalRoundsWatch !== 1;
  return (
    <>
      <Space style={!isMultiRounds ? { marginBottom: 20 } : undefined}>
        <Switch checked={isMultiRounds} onChange={value => form.setFieldValue('totalRounds', value ? 2 : 1)} />
        <Typography.Text type='secondary'>
          Add more rounds
          &nbsp;
          <Tooltip content='This function allows you to include more than one round of trials in the survey.'>
            <IconQuestionCircle />
          </Tooltip>
        </Typography.Text>
      </Space>
      {
        isMultiRounds && (
          <Item
            field='totalRounds'
            extra='To create the second-round trial block in Qualtrics, click the "Copy" button on the top-right of the "Run trial" block to replicate.'
            style={{ marginTop: 6 }}
          >
            <InputNumber suffix='rounds' min={1} style={{ width: 160 }} />
          </Item>
        )
      }
    </>
  );
}

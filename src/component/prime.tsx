import { Button, Form, Grid, Input, InputNumber, Select, Space, Switch, Typography } from '@arco-design/web-react';
import { IconDelete, IconPlus } from '@arco-design/web-react/icon';
import React, { useEffect, type ReactNode } from 'react';
import type { AmpStimuli, AmpStimuliPrimeItem } from '../data/ampTypes';
import { uid } from '../data/uid';

const { Item, List } = Form;
const { Row, Col } = Grid;
const { Option } = Select;


interface PrimeItemProps {
  field: string,
  index: number,
  remove: () => void,
  staticItemOptions: ReactNode,
  stimuliField: string,
}
export const PrimeItem: React.FC<PrimeItemProps> = ({ field, index, remove, staticItemOptions, stimuliField }) => {
  const { form } = Form.useFormContext();
  const itemsWatch = Form.useWatch(stimuliField + '.items', form) as AmpStimuli['items'];
  const primeWatch = Form.useWatch(stimuliField + '.prime', form) as AmpStimuli['prime'];
  const itemTypeWatch = Form.useWatch(field + '.itemType', form) as AmpStimuliPrimeItem['itemType']; // TODO: can use getFieldValue instead?

  // When stimuli change, remove invalid staticItem
  const itemsUids = itemsWatch.map(({ uid }) => uid).sort();
  useEffect(() => {
    const value = form.getFieldValue(field) as AmpStimuliPrimeItem;
    if (value.staticItemUid !== undefined && !itemsUids.includes(value.staticItemUid)) {
      form.clearFields(field + '.staticItemUid');
    }
  }, [JSON.stringify(itemsUids)]);

  // When prime changes, remove invalid randomItemExcludeUid
  const primeUids = primeWatch.map(({ uid }) => uid).sort();
  useEffect(() => {
    const currentUids = form.getFieldValue(field + '.randomItemExcludeUid') as AmpStimuliPrimeItem['randomItemExcludeUid'];
    if (currentUids?.length) {
      const validUids = primeUids.slice(0, index);
      const filteredUids = currentUids.filter(uid => validUids.includes(uid));
      if (filteredUids.length !== currentUids.length) {
        form.setFieldValue(field + '.randomItemExcludeUid', filteredUids);
      }
    }
  }, [JSON.stringify(primeUids)]);

  return (
    <Row gutter={24} style={{ width: '100%' }}>
      <Col span={6}>
        <Item
          label='Name'
          field={field + '.name'}
          rules={[{ required: true }]}
          layout='vertical'
        >
          <Input style={{ width: 200 }} />
        </Item>
      </Col>

      <Col span={6} style={{ textAlign: 'left' }}>
        <Item
          field={field + '.itemType'}
          label='Which stimuli'
          layout='vertical'
        >
          <Select
            options={[
              { label: 'Pick one now', value: 'static' },
              { label: 'Select randomly', value: 'randomExclude' }
            ]}
            style={{ width: 200 /* Must specify width here to avoid ResizeObserver error */ }}
          />
        </Item>
      </Col>

      <Col span={6} style={{ textAlign: 'left' }}>
        {
          itemTypeWatch === 'static' ? (
            <Item
              field={field + '.staticItemUid'}
              label='Pick a stimuli'
              rules={[{ required: true }]}
              layout='vertical'
            >
              <Select style={{ width: 200 }}>
                {staticItemOptions}
              </Select>
            </Item>
          ) : (
            <Item
              field={field + '.randomItemExcludeUid'}
              label='Avoid choosing the same as'
              layout='vertical'
            >
              <Select
                style={{ width: 200 }} mode='multiple'
                options={primeWatch.slice(0, index).map(({ uid, name }) => ({ value: uid, label: name }))}
              />
            </Item>
          )
        }
      </Col>

      <Col span={5}>
        <Item label='Override stimuli count' layout='vertical'>
          <Space>
            <Item
              label='Override stimuli count'
              field={field + '.isEnableOverrideCount'}
              noStyle
            >
              <Switch />
            </Item>
            <Item
              label='Override stimuli count'
              field={field + '.overrideCount'}
              noStyle
            >
              <InputNumber
                disabled={!form.getFieldValue(field + '.isEnableOverrideCount')}
                min={0}
              />
            </Item>
          </Space>
        </Item>
      </Col>

      <Col span={1}>
        <Item label={<br />} layout='vertical'>
          <Button
            icon={<IconDelete />}
            shape='circle'
            status='danger'
            onClick={() => remove()}
          />
        </Item>
      </Col>
    </Row>
  );
};

export const Prime: React.FC<{ field: string }> = ({ field }) => {
  const { form } = Form.useFormContext();
  const itemsWatch = Form.useWatch(field + '.items', form) as AmpStimuli['items'];
  const stimuliField = field;

  const staticItemOptions = itemsWatch?.map(({ content, uid }, index) => (
    <Option value={uid}>
      <div style={{ display: 'flex' }}>
        {index + 1}
        <img src={content} style={{ width: 32, height: 32 }} />
      </div>
    </Option>
  )) ?? [];

  return (
    <div>
      <h3 style={{ display: 'flex' }}>Priming</h3>
      <List field={field + 'prime'} noStyle>
        {
          (fields, { add, remove, move }) => <>
            {fields.length === 0 ? <p>No priming.</p> : null}
            {fields.map(({ key, field }, index) => (
              <PrimeItem
                field={field} index={index} remove={() => remove(index)} key={key}
                staticItemOptions={staticItemOptions} stimuliField={stimuliField}
              />
            ))}
            <Button shape='round' onClick={() => add(newPrimeItem(fields.length))} type='outline'>
              <IconPlus />Add Priming Stimuli
            </Button>
          </>
        }
      </List>
    </div>
  );
};


function newPrimeItem(i: number): AmpStimuliPrimeItem {
  return {
    name: `priming_${i + 1}`,
    itemType: 'randomExclude',
    randomItemExcludeUid: [],
    isEnableOverrideCount: false,
    overrideCount: 0,
    uid: uid(),
  }
}

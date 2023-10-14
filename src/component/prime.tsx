import { Button, Form, Grid, Input, InputNumber, Select, Space, Switch, Typography } from '@arco-design/web-react';
import { IconDelete, IconPlus } from '@arco-design/web-react/icon';
import React, { useEffect } from 'react';
import type { AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem } from '../data/ampTypes';
import { uid } from '../data/uid';
import { findPrimeRepresentationFromUid } from '../util/util';

const { Item, List } = Form;
const { Row, Col } = Grid;
const { Option, OptGroup } = Select;


const PrimeItemOptions = (stimuliItems: AmpStimuliItem[], primeItems: AmpStimuliPrimeItem[], hiddenUids: number[] = []) => ([
  // Hiding inside instead of filtering outside, because displayed stimuliItems depend on their index in original array
  <OptGroup label='Stimuli items' key='stimuli'>
    {
      stimuliItems.map(({ uid, content }, index) => (
        hiddenUids.includes(uid) ? null :
          <Option value={uid} key={uid}>
            <div style={{ display: 'flex' }}>
              {index + 1}
              <img src={content} style={{ width: 32, height: 32 }} />
            </div>
          </Option>
      ))
    }
  </OptGroup>
  ,
  <OptGroup label='Primings above' key='priming'>
    {
      primeItems.map(({ uid, name }) => (
        hiddenUids.includes(uid) ? null :
          <Option value={uid} key={uid}>
            {name}
          </Option>
      ))
    }
  </OptGroup>
])

interface PrimeItemProps {
  field: string,
  index: number,
  remove: () => void,
  stimuliField: string,
  isEnablePriming: boolean,
}
const PrimeItem: React.FC<PrimeItemProps> = ({ field, index, remove, stimuliField, isEnablePriming }) => {
  const { form } = Form.useFormContext();
  const itemsWatch = Form.useWatch(stimuliField + '.items', form) as AmpStimuli['items'];
  const primeWatch = Form.useWatch(stimuliField + '.prime', form) as AmpStimuli['prime'];
  const includeUidsWatch = Form.useWatch(field + '.includeUids', form) as number[];

  // When option changes, remove invalid options
  const optionUids = [...itemsWatch, ...primeWatch].map(({ uid }) => uid);
  useEffect(() => {
    const includeUids = form.getFieldValue(field + '.includeUids') as AmpStimuliPrimeItem['includeUids'];
    if (includeUids?.length) {
      const filteredUids = includeUids.filter(uid => optionUids.includes(uid));
      if (filteredUids.length !== includeUids.length) {
        form.setFieldValue(field + '.includeUids', filteredUids);
      }
    }
    const excludeUids = form.getFieldValue(field + '.excludeUids') as AmpStimuliPrimeItem['excludeUids'];
    if (excludeUids?.length) {
      const filteredUids = excludeUids.filter(uid => optionUids.includes(uid));
      if (filteredUids.length !== excludeUids.length) {
        form.setFieldValue(field + '.excludeUids', filteredUids);
      }
    }
  }, [JSON.stringify([...optionUids].sort())]);


  const renderFormat = (option: any, value: any) => {
    return findPrimeRepresentationFromUid(value, form.getFieldValue(stimuliField));
  };

  return (
    <Row gutter={24} style={{ width: '100%' }}>
      <Col span={6}>
        <Item
          label='Name'
          field={field + '.name'}
          rules={[{ required: true }]}
          layout='vertical'
          disabled={!isEnablePriming}
        >
          <Input style={{ width: 240 }} />
        </Item>
      </Col>

      <Col span={6} style={{ textAlign: 'left' }}>
        <Item
          field={field + '.includeUids'}
          label='Included items'
          layout='vertical'
          disabled={!isEnablePriming}
        >
          <Select
            mode='multiple' style={{ width: 240 }} renderFormat={renderFormat}
            placeholder='All stimuli items'
          >
            {PrimeItemOptions(itemsWatch, primeWatch.slice(0, index))}
          </Select>
        </Item>
      </Col>

      <Col span={6} style={{ textAlign: 'left' }}>
        <Item
          field={field + '.excludeUids'}
          label='Excluded items'
          layout='vertical'
          disabled={!isEnablePriming}
        >
          <Select
            mode='multiple' style={{ width: 240 }} renderFormat={renderFormat}
          >
            {PrimeItemOptions(itemsWatch, primeWatch.slice(0, index), includeUidsWatch)}
          </Select>
        </Item>
      </Col>

      <Col span={5}>
        <Item label='Override stimuli count' layout='vertical'>
          <Space>
            <Item
              label='Override stimuli count'
              field={field + '.isEnableOverrideCount'}
              triggerPropName='checked'
              disabled={!isEnablePriming}
              noStyle
            >
              <Switch />
            </Item>
            <Item
              label='Override stimuli count'
              field={field + '.overrideCount'}
              disabled={!isEnablePriming || !form.getFieldValue(field + '.isEnableOverrideCount')}
              noStyle
            >
              <InputNumber min={0} />
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
            disabled={!isEnablePriming}
          />
        </Item>
      </Col>
    </Row>
  );
};


export const Prime: React.FC<{ field: string }> = ({ field }) => {
  const { form } = Form.useFormContext();
  const isEnablePrimingWatch = Form.useWatch(field + '.isEnablePriming', form) as boolean;
  const stimuliField = field;

  return (
    <div style={{ textAlign: 'left' }}>
      <Space>
        <h3 style={{ display: 'flex' }}>Priming</h3>
        <Item field={field + '.isEnablePriming'} triggerPropName='checked' noStyle><Switch /></Item>
      </Space>
      {
        isEnablePrimingWatch ? <>
          <p>
            Here you can pick stimuli randomly at run-time, based on specified rules. <br />
            Then, you can change selected stimuli's count, and use them as embedded data.
          </p>
          <List field={field + '.prime'} noStyle>
            {
              (fields, { add, remove, move }) => <>
                {fields.length === 0 ? <p>No priming.</p> : null}
                {fields.map(({ key, field }, index) => (
                  <PrimeItem
                    field={field} index={index} remove={() => remove(index)} key={key}
                    stimuliField={stimuliField} isEnablePriming={isEnablePrimingWatch}
                  />
                ))}
                <Button shape='round' onClick={() => add(newPrimeItem(fields.length))} type='outline'>
                  <IconPlus />Add Priming Stimulus
                </Button>
              </>
            }
          </List>
        </> : null
      }
    </div>
  );
};


function newPrimeItem(i: number): AmpStimuliPrimeItem {
  return {
    name: `priming_${i + 1}`,
    includeUids: [],
    excludeUids: [],
    isEnableOverrideCount: false,
    overrideCount: 0,
    uid: uid(),
  }
}

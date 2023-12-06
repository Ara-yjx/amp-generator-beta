import { Button, Divider, Form, Grid, Input, InputNumber, Select, Space, Switch, Tooltip } from '@arco-design/web-react';
import { IconDelete, IconPlus, IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { useEffect } from 'react';
import { StimuliThumbnail } from './stimuliThumbnail';
import type { AmpStimuli, AmpStimuliItem, AmpStimuliPrimeItem } from '../data/ampTypes';
import { uid } from '../data/uid';
import { findPrimeRepresentationFromUid } from '../util/util';
import range from 'lodash/range';

const { Item, List } = Form;
const { Row, Col } = Grid;
const { Option, OptGroup } = Select;

// const PrimeOverride: React.FC<ArcoFormItem<AmpStimuliPrimeItem['overrideCount'] & field>> = ({ value, onChange }) => 
const PrimeOverride: React.FC<{ field: string }> = ({ field }) => {
  type OverrideType = 'no' | 'const' | 'var';
  const getOverrideType = (overrideCount: AmpStimuliPrimeItem['overrideCount']) => (
    overrideCount === null ? 'no' : (
      Array.isArray(overrideCount) ? 'var' : 'const'
    )
  );
  const { form } = Form.useFormContext();
  const value = Form.useWatch(field, form) as AmpStimuliPrimeItem['overrideCount'];
  const type = getOverrideType(value);
  const totalRounds = Form.useWatch('totalRounds', form) as number;
  const onTypeChange = (newType: OverrideType) => {
    if (newType !== type) {
      if (newType === 'no') {
        form.setFieldValue(field, null);
      } else if (newType === 'const') {
        form.setFieldValue(field, 0);
      } else if (newType === 'var') {
        form.setFieldValue(field, Array(totalRounds).fill(type === 'const' ? value : 0));
      }
    }
  }
  // When totalRounds changes, remove extra
  useEffect(() => {
    if (type === 'var') {
      const alignedOverrideCount = [...(value as (number | undefined)[]), ...Array(totalRounds).fill(undefined)].slice(0, totalRounds);
      form.setFieldValue(field, alignedOverrideCount);
    }
  }, [totalRounds]);

  return (
    <>
      <Row>
        <Col offset={2} span={22}>
          <Space align='start'>
            <Item label='Override stimuli count: ' layout='inline' style={{ margin: 10 }}>
              <Select
                style={{ width: 300 }}
                options={[
                  { label: 'No override', value: 'no' },
                  { label: 'Same count for all rounds', value: 'const' },
                  { label: 'Different count for each round', value: 'var' },
                ]}
                value={type}
                onChange={onTypeChange}
              />
            </Item>
            {
              type === 'const' && (
                <Item field={field} style={{ width: 100, margin: 10 }} layout='inline' rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Item>
              )
            }
          </Space>
        </Col>
      </Row>
      {
        type === 'var' && (
          <Row style={{ marginBottom: 20 }}>
            <Col offset={4} span={20}>
              <Space wrap /* split={<Divider type='vertical' style={{ height: 40 }} />} */>
                {
                  range(totalRounds).map(roundIndex => (
                    <Item
                      field={`${field}[${roundIndex}]`}
                      label={`Round ${roundIndex + 1}`}
                      labelCol={{ style: { margin: 0 } }}
                      layout='vertical'
                      style={{ width: 150, margin: 0 }}
                      key={roundIndex}
                    >
                      <InputNumber min={0} placeholder='(no override)' />
                    </Item>
                  ))
                }
              </Space>
            </Col>
          </Row>
        )
      }
    </>
  )
}


const PrimeItemOptions = (stimuliItems: AmpStimuliItem[], primeItems: AmpStimuliPrimeItem[], hiddenUids: number[] = []) => ([
  // Hiding inside instead of filtering outside, because displayed stimuliItems depend on their index in original array
  <OptGroup label='Stimuli items' key='stimuli'>
    {
      stimuliItems.map(({ uid, type, content }, index) => (
        hiddenUids.includes(uid) ? null :
          <Option value={uid} key={uid}>
            <StimuliThumbnail indexDisplay={index + 1} type={type} content={content} />
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
  const nameWatch = Form.useWatch(field + '.name', form) as string;

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

  // Same value should not exist. (primeWatch is the value in prev iter, before onChange actually alters form value.)
  const validateNameUnique = (value: string | undefined) => !primeWatch.some(({ name }) => name === value);

  return (
    <>
      <Row gutter={24} style={{ width: '100%', marginTop: 10 }}>
        <Col span={6}>
          <Item
            label='Name'
            field={field + '.name'}
            layout='vertical'
            disabled={!isEnablePriming}
            style={{ margin: 5 }}
            rules={[
              { required: true },
              {
                validator(value, cb) {
                  validateNameUnique(value) ? cb() : cb('Duplicated name.')
                },
                validateTrigger: 'onChange',
              },
            ]}
          >
            <Input style={{ width: 280 }} />
          </Item>
        </Col>
        <Col span={1}>
          <Tooltip content={<>
            You can access the randomization result through these embeeded data:
            <li>prime_stimuli_{index + 1}_{nameWatch}_item_index</li>
            <li>prime_stimuli_{index + 1}_{nameWatch}_content</li>
            <li>prime_stimuli_{index + 1}_{nameWatch}_type</li>
          </>} position='top'>
            <IconQuestionCircle />
          </Tooltip>
        </Col>

        <Col span={8} style={{ textAlign: 'left' }}>
          <Item
            field={field + '.includeUids'}
            label='Included items'
            layout='vertical'
            disabled={!isEnablePriming}
            style={{ margin: 5 }}
          >
            <Select
              mode='multiple' style={{ width: 320 }} renderFormat={renderFormat}
              placeholder='All stimuli items'
            >
              {PrimeItemOptions(itemsWatch, primeWatch.slice(0, index))}
            </Select>
          </Item>
        </Col>

        <Col span={8} style={{ textAlign: 'left' }}>
          <Item
            field={field + '.excludeUids'}
            label='Excluded items'
            layout='vertical'
            disabled={!isEnablePriming}
            style={{ margin: 5 }}
          >
            <Select
              mode='multiple' style={{ width: 320 }} renderFormat={renderFormat}
            >
              {PrimeItemOptions(itemsWatch, primeWatch.slice(0, index), includeUidsWatch)}
            </Select>
          </Item>
        </Col>

        <Col span={1}>
          <Item label={<br />} layout='vertical' style={{ margin: 0 }}>
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
      <PrimeOverride field={field + '.overrideCount'} />
    </>
  );
};


export const Prime: React.FC<{ field: string }> = ({ field }) => {
  const { form } = Form.useFormContext();
  const isEnablePrimingWatch = Form.useWatch(field + '.isEnablePriming', form) as boolean;
  const stimuliField = field;
  const totalRoundsWatch = Form.useWatch(field + '.totalRounds', form) as number;

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
                <Button shape='round' onClick={() => add(newPrimeItem(fields.length, totalRoundsWatch))} type='outline'>
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


function newPrimeItem(i: number, rounds: number): AmpStimuliPrimeItem {
  return {
    name: `priming_${i + 1}`,
    includeUids: [],
    excludeUids: [],
    overrideCount: null,
    uid: uid(),
  }
}

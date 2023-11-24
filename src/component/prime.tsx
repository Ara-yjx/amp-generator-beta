import { Button, Collapse, Form, Grid, Input, InputNumber, Select, Space, Switch, Tooltip, Typography } from '@arco-design/web-react';
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
const { Text } = Typography;


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
  const totalRoundsWatch = Form.useWatch('totalRounds', form) as number;
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

  // When totalRounds changes, remove extra 
  useEffect(() => {
    const overrideCount = [...form.getFieldValue(`${field}.overrideCount`), ...Array(totalRoundsWatch).fill(null)].slice(0, totalRoundsWatch);
    form.setFieldValue(`${field}.overrideCount`, overrideCount);
  }, [totalRoundsWatch]);

  const renderFormat = (option: any, value: any) => {
    return findPrimeRepresentationFromUid(value, form.getFieldValue(stimuliField));
  };

  // Same value should not exist. (primeWatch is the value in prev iter, before onChange actually alters form value.)
  const validateNameUnique = (value: string|undefined) => !primeWatch.some(({name}) => name === value);

  return (
    <>
      <Row gutter={24} style={{ width: '100%' }}>
        <Col span={6}>
          <Item
            label='Name'
            field={field + '.name'}
            layout='vertical'
            disabled={!isEnablePriming}
            style={{ margin: 0 }}
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
            style={{ margin: 0 }}
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
            style={{ margin: 0 }}
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
      <Row>
        <Col span={22} offset={2}>
          <Collapse bordered={false}>
            <Collapse.Item name='.' header={
              <Text type='secondary'>
                {'Override stimuli count : '}
                {form.getFieldValue(field).overrideCount.map(String).join(' / ')}
              </Text>
            }>
              {
                range(totalRoundsWatch).map(roundIndex => (
                  <Item
                    field={`${field}.overrideCount[${roundIndex}]`}
                    label={`Round ${roundIndex + 1}`}
                    layout='horizontal'
                    style={{ width: 300, margin: 0 }}
                    key={roundIndex}
                  >
                    <InputNumber min={0} placeholder='(no override)' />
                  </Item>
                ))
              }

            </Collapse.Item>
          </Collapse>
        </Col>
      </Row>
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
    overrideCount: Array(rounds).fill(null),
    uid: uid(),
  }
}

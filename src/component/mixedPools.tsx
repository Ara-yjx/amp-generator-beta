import { Button, Checkbox, Divider, Form, Grid, Input, InputNumber, Select, Space, Switch, Tabs, Tooltip } from '@arco-design/web-react';
import React, { useEffect } from 'react';
import type { AmpParams, AmpStimuli, MixedPool, MixedPoolSource } from '../data/ampTypes';
import { uid } from '../data/uid';
import { DraggableTabs } from './DraggableTabs';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconDelete, IconPlus, IconQuestionCircle } from '@arco-design/web-react/icon';
import { ArcoFormItem } from '../util/arco';
import useOptionGuards from '../hooks/useOptionGuard';
import { OptionsType } from '@arco-design/web-react/es/Select/interface';

const { Item, List } = Form;
const { Row, Col } = Grid;

const MixedPoolSourceTooltip = (
  <Tooltip content={
    <ul>
      <li>Two sources can be the same pool. It will be picked twice independently.</li>
      <li>You can "over-pick": If source count &gt; pool size, you do pick all its stimuli and then start a second round of pick.</li>
      <li>The source can be another mixed pool that has not enabled "Reset this pool for each trial".</li>
    </ul>
  }>
    <IconQuestionCircle />
  </Tooltip>
);



const MixedPoolSourceInput: React.FC<{
  field: string,
  sourceIndex: number,
  mixedPoolIndex: number,
  remove: (index: number) => void
}> = ({ field, sourceIndex, mixedPoolIndex, remove }) => {
  const { form } = useFormContext();
  const stimuliWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const mixedPoolsWatch = useWatch('mixedPools', form) as AmpParams['mixedPools'];
  const labelsWatch = useWatch(`labels`, form) as AmpParams['labels'] | undefined;
  const value = useWatch(field, form) as MixedPoolSource;
  const countType = useWatch(`${field}.count[0]`, form) as string;

  const isSimplePoolType = value.poolType === 'pool';

  const sourcePoolOptionsOfPool = stimuliWatch.map((stimuli: AmpStimuli, index: number) => ({
    label: `${index + 1}`,
    value: index,
  }));
  const sourcePoolOptionsOfMixedPool = (mixedPoolsWatch ? mixedPoolsWatch.slice(0, mixedPoolIndex).map(mixedPool => ({
    label: mixedPool.name,
    value: mixedPool.name,
    disabled: mixedPool.resetForEachTrial,
  })) : []);
  const sourcePoolOptions = isSimplePoolType ? sourcePoolOptionsOfPool : sourcePoolOptionsOfMixedPool;
  
  useOptionGuards(`${field}.pools`, sourcePoolOptions, { multiple: true });
  

  const labelRuleOptions = isSimplePoolType ? [
    { label: 'Contain all of', value: 'ALL' },
    { label: 'Contain at least one of', value: 'ANY' },
    { label: 'Are exactly', value: 'EQUAL' },
    { label: '(Ignore labels)', value: 'NONE' },
  ] : [
    { label: '(Ignore labels)', value: 'NONE' },
  ];

  useOptionGuards(`${field}.label.rule`, labelRuleOptions, { defaultValue: 'NONE' });

  const sourceLabelOptions = labelsWatch?.map(label => ({
    label: (
      <div style={{ backgroundColor: label.color, margin: -2, padding: '0 4px', minWidth: 4 }}>
        {label.name}&nbsp;
        {/* Display an colored block when name is empty */}
      </div>
    ),
    value: label.uid,
    extra: { color: label.color },
  })) ?? [];

  useOptionGuards(`${field}.label.labels`, sourceLabelOptions, { multiple: true });

  // When countType change, remove redundant fields
  useEffect(() => {
    if (['constant', 'rest'].includes(countType) && value.count[2] !== undefined) {
      form.setFieldValue(`${field}.count[2]`, undefined);
    }
    if (countType === 'rest' && value.count[1] !== undefined) {
      form.setFieldValue(`${field}.count[1]`, undefined);
    }
  }, [countType, value.count[1], value.count[2], form]);


  const countTypeOptions: OptionsType = [
    { label: 'Constant', value: 'constant' },
    { label: 'Uniform distribution of', value: 'uniform' },
    { label: 'Rest-of-total-count', value: 'rest', disabled: mixedPoolsWatch?.[mixedPoolIndex]?.totalCount === undefined },
  ];

  useOptionGuards(`${field}.count[0]`, countTypeOptions, { defaultValue: 'constant' });

  return (
    <Space direction='vertical' style={{ width: '100%' }}>

      <Row align='center'>
        <Col flex='2rem'>-</Col>
        <Col flex='11rem'>From</Col>
        <Col flex='auto'>
          <Space>
            <Item field={`${field}.poolType`} noStyle>
              <Select
                options={[
                  { label: 'Pool', value: 'pool' },
                  { label: 'Mixed Pool', value: 'mixedPool' },
                ]}
                style={{ width: 200 }}
              />
            </Item>
            <Item field={`${field}.pools`} noStyle>
              <Select options={sourcePoolOptions} style={{ width: 500 }} mode='multiple' maxTagCount={5} />
            </Item>
          </Space>
        </Col>
        <Col flex='40px'>
          <Button onClick={() => remove(sourceIndex)} shape='circle' status='danger' icon={<IconDelete />} />
        </Col>
      </Row>

      <Row align='center'>
        <Col flex='2rem'></Col>
        <Col flex='11rem'>Find items whose labels</Col>

        <Col flex='auto'>
          <Space>
            <Item field={`${field}.label.rule`} noStyle
              disabled={!isSimplePoolType}
              extra={isSimplePoolType ? undefined : 'Cannot select by label for Mixed Pools'}
            >
              <Select
                options={labelRuleOptions} style={{ width: 200 }}
              />
            </Item>

            {
              ['ALL', 'ANY', 'EQUAL'].includes(`${value.label?.rule}`) && (
                <Item field={`${field}.label.labels`} noStyle>
                  <Select
                    options={sourceLabelOptions} style={{ width: 500 }} mode='multiple' maxTagCount={5}
                  />
                </Item>
              )
            }
          </Space>
        </Col>
      </Row>

      <Row align='center'>
        <Col flex='2rem'></Col>
        <Col flex='11rem'>Pick</Col>
        <Col flex='auto'>
          <Space>
            <Item field={`${field}.count[0]`} noStyle>
              <Select
                options={countTypeOptions}
                style={{ width: 200 }}
              />
            </Item>
            {
              countType === 'constant' && (
                <Item field={`${field}.count[1]`} noStyle>
                  <InputNumber min={0} style={{ width: 80 }} />
                </Item>
              )
            }
            {
              countType === 'uniform' && (
                <>
                  <Item field={`${field}.count[1]`} noStyle>
                    <InputNumber min={0} style={{ width: 80 }} />
                  </Item>
                  -
                  <Item field={`${field}.count[2]`} noStyle>
                    <InputNumber min={0} style={{ width: 80 }} />
                  </Item>
                </>
              )
            }
            such stimuli items
          </Space>
        </Col>
      </Row>
    </Space>
  )
};


const MixedPoolTotalCountInput: React.FC<ArcoFormItem<number>> = ({ value, onChange }) => {
  return (
    <Space>
      <Select
        options={[{ label: 'No restriction', value: 0 }, { label: 'Fixed', value: 1 }]}
        style={{ width: 200 }}
        value={value === undefined ? 0 : 1}
        onChange={v => onChange?.(v === 0 ? undefined : 1)}
      />
      {
        value !== undefined && (
          <InputNumber min={1} value={value} onChange={onChange} style={{ width: 100 }} />
        )
      }
    </Space>
  )
};


const MixedPoolTab: React.FC<{ field: string, index: number }> = ({ field, index }) => {
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <Row gutter={12} align='center'>
        <Col span={6}>
          <Item field={`${field}.name`} layout='vertical' label='Name'>
            <Input
              placeholder='Mixed Pool Name'
              style={{ width: 200 }}
            />
          </Item>
        </Col>
        <Col span={6}>
          <Item field={`${field}.resetForEachTrial`} layout='vertical' label='Reset this pool for each trial' triggerPropName='checked'>
            <Checkbox />
          </Item>
        </Col>
        <Col span={12}>
          <Item field={`${field}.totalCount`} layout='vertical' label='Total stimuli count'>
            <MixedPoolTotalCountInput />
          </Item>
        </Col>

      </Row>
      <Divider />

      <Item label={<Space>Sources {MixedPoolSourceTooltip}</Space>}>
        <List field={`${field}.sources`}>
          {(fields, { add, remove }) => (
            <Space direction='vertical' style={{ width: '100%' }}>
              {fields.map(({ field, key }, sourceIndex) => (
                <MixedPoolSourceInput field={field} key={key} sourceIndex={sourceIndex} mixedPoolIndex={index} remove={remove} />
              ))}
              <Row align='center'>
                <div style={{ width: '2em' }}>-</div>
                <Button onClick={() => add({ poolType: 'pool', pools: [], count: ['constant', 1] } as MixedPoolSource)} icon={<IconPlus />} />
              </Row>
            </Space>
          )}
        </List>
      </Item>
    </div>
  )
};

const MixedPoolTitle: React.FC<{ field: string, index: number }> = ({ field, index }) => {
  const { form } = useFormContext();
  const name = useWatch(`${field}.name`, form);
  return name;
};



const MixedPoolInner: React.FC = () => {
  const { form } = useFormContext();
  const getNewMixedPool = (index: number): MixedPool => {
    let availableIndex = index;
    while ((form.getFieldValue('mixedPools') as AmpParams['mixedPools'] | undefined)?.some(
      pool => pool.name === `mix-${availableIndex + 1}`
    )) {
      availableIndex++;
    }
    return {
      uid: uid(),
      name: `mix-${availableIndex + 1}`,
      sources: [],
    };
  };
  return (
    <DraggableTabs
      field='mixedPools'
      renderTab={MixedPoolTab}
      renderTitle={MixedPoolTitle}
      provideNewTab={getNewMixedPool}
      warningOnDelete={() => `⚠️⚠️⚠️ Are you sure to delete this Mixed Pool completely?`}
    />
  );
}

export const MixedPools: React.FC = () => {

  const { form } = useFormContext();
  const isMixedPoolEnabled = useWatch('isMixedPoolEnabled', form);
  const value = useWatch('mixedPools', form) as AmpParams['mixedPools'] | undefined;

  useEffect(() => {
    if (isMixedPoolEnabled && !value?.length) {
      form.setFieldValue('mixedPools', [{
        uid: uid(),
        name: 'mix-1',
        sources: [],
      }]);
    }
  }, [isMixedPoolEnabled, value?.length]);

  return (
    <Space direction='vertical'>
      <Space style={{ width: '100%' }}>
        <h3 style={{ textAlign: 'left' }}>Mixed Pool</h3>
        <Item field='isMixedPoolEnabled' triggerPropName='checked' noStyle>
          <Switch />
        </Item>
        <Tooltip content='Pick stimuli from multiple pools and mix into a new pool.'>
          <IconQuestionCircle />
        </Tooltip>
      </Space>


      {isMixedPoolEnabled ? <MixedPoolInner /> : null}
    </Space>
  )
}

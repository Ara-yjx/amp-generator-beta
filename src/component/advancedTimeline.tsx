import { Button, Card, Checkbox, Divider, Form, FormInstance, InputNumber, Select, Space, Switch, Tag, Tooltip, Typography } from '@arco-design/web-react';
import { IconApps, IconArrowDown, IconArrowFall, IconBranch, IconDelete, IconDown, IconEdit, IconPlus, IconQuestionCircle, IconSkipNext } from '@arco-design/web-react/icon';
import React, { Fragment, useEffect, useState } from 'react';
import type { AmpStimuli, AmpTimeline, ElementPoolMapping, AT, AmpParams } from '../data/ampTypes';
import { AddRemoveButtons } from './addRemoveButtons';
import { ElementLayoutMappingEditor } from './elementLayoutMappingEditor';
import { addToList, removeFromList } from '../util/formUtil';
import { AcceptedKeys } from './acceptedKeys';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import useForm from '@arco-design/web-react/es/Form/useForm';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import { dropWhile, range } from 'lodash';
import { LayoutEditor } from './layoutEditor';
import { getLayoutFromLayoutDisplays } from '../util/util';
import useOptionGuards from '../hooks/useOptionGuard';

const { Item, List } = Form;
const { Text, Title } = Typography;


const emptyPage: AT.Page = {
  // layout: [1],
  // displays: [{ row: 1, col: 1, src: null }],
  layoutedDisplays: [[['blank']]],
  response: {
    keyboard: { enabled: false, keys: [], delayBefore: 0, delayAfter: 0 },
    timeout: { enabled: true, duration: 1000 },
  },
  interval: 0,
}

export const ATLayout: React.FC<{ field: string }> = ({ field }) => {
  const { form } = useFormContext();
  const layoutWatch = useWatch(`${field}.layout`, form);
  const layoutStringify = '[' + layoutWatch?.join('+') + ']';
  return (
    <div>
      <Item label='Page layout' layout='inline'>
        <Space>
          {layoutStringify}
          <Button iconOnly icon={<IconEdit />} />
        </Space>
      </Item>
    </div>
  )
}

export const ATPageCondition: React.FC<{ field: string, pageIndex: number }> = ({ field, pageIndex }) => {

  const { form } = useFormContext();
  const conditionWatch = useWatch(`${field}.condition`, form);
  // console.log('conditionWatch', conditionWatch)
  const conditionPageOptions = range(pageIndex).map((_, index) => ({
    label: `Page #${index + 1}`, value: index,
  }));
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[] | undefined;
  const selectedPageResponseWatch = pagesWatch?.[conditionWatch[1]]?.response;
  // const selectedPageResponseWatch = useWatch(`advancedTimeline.pages[${conditionWatch[1]}].response`, form) as AT.Page['response'] | undefined;
  // console.log('selectedPageResponseWatch', `advancedTimeline.pages[${conditionWatch[1]}].response`, selectedPageResponseWatch)
  const conditionResponseOptions = [];
  if (selectedPageResponseWatch?.timeout.enabled) {
    conditionResponseOptions.push({ label: `Fixed duration`, value: '_AP' })
  }
  if (selectedPageResponseWatch?.keyboard.enabled) {
    selectedPageResponseWatch?.keyboard.keys.map(key =>
      conditionResponseOptions.push({ label: key, value: key })
    );
  }

  useOptionGuards(`${field}.condition[1]`, conditionPageOptions);
  useOptionGuards(`${field}.condition[3]`, conditionResponseOptions, { multiple: true });

  return (
    <Space style={{ fontSize: 14 }}>
      {/* <Select
          options={[
            { label: '✓ Always display this page.', value: 0 },
            { label: 'Display this page conditionally:', value: 1 }
          ]}
          size='small'
          style={{ width: 280 }}
          value={conditionValue}
          onChange={onConditionChange}
          disabled={pageIndex === 0}
        /> */}

      <IconBranch />

      Display this page only if
      <Item field={`${field}.condition[1]`} noStyle>
        <Select options={conditionPageOptions} style={{ width: 100 }} />
      </Item>
      's response
      <Item field={`${field}.condition[2]`} noStyle>
        <Select options={[{ label: 'is', value: '==' }, { label: 'is not', value: '!=' }]} style={{ width: 100 }} />
      </Item>
      <Item field={`${field}.condition[3]`} noStyle>
        <Select
          mode='multiple'
          options={conditionResponseOptions}
          style={{ width: 200 }}
          notFoundContent={
            <Typography.Text disabled>
              The selected page needs to have at least one type of response.
            </Typography.Text>
          }
        />
      </Item>

    </Space>
  )
}

export const ATLayoutItem: React.FC<{ field: string, page: number, row: number, col: number, options?: { label: string, value: number }[] }> = ({ field, page, row, col }) => {
  const { form } = useFormContext();
  const poolsWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[];
  const poolOptions = poolsWatch.map((_, index) => ({
    label: `Pool ${index + 1}`, value: ['pool', index].join('.')
  }));
  const prevPageOptions = pagesWatch.slice(0, page).flatMap((p, pIndex) =>
    p.layoutedDisplays.flatMap((ldRow, ldRowIndex) =>
      ldRow.filter(ldCol => ldCol?.[0] === 'pool').map((ldCol, ldColIndex) => ({
        label: `Copy Page#${pIndex + 1} Item${ldRowIndex + 1}-${ldColIndex + 1} (Pool ${ldCol![1]! + 1})`,
        value: ['copy', pIndex, ldRowIndex, ldColIndex].join('.'),
      }))
    )
  );
  const blankOption = { label: '(blank)', value: 'blank' }
  // TODO: current page options
  const layoutItemOptions = [blankOption, ...poolOptions, ...prevPageOptions];
  function normalizeLayoutItem(v: string | undefined): AT.DisplaySrc | undefined {
    if (v === undefined) return undefined;
    const split = v.split('.');
    // Parse string to number except first item;
    const splitToInt = split.map((item, index) => index === 0 ? item : parseInt(item)) as AT.DisplaySrc;
    return splitToInt;
  }
  function formatterLayoutItem(v: AT.DisplaySrc | undefined): string | undefined {
    if (v === undefined) return undefined;
    return v?.join('.') ?? 'null';
  }

  useOptionGuards(field, layoutItemOptions, { formatter: formatterLayoutItem, defaultValue: ['blank'] });


  return (
    /* @ts-ignore */
    <Item field={field} normalize={normalizeLayoutItem} formatter={formatterLayoutItem} noStyle>
      <Select
        style={{ width: 240, padding: 10 }}
        options={layoutItemOptions}
      />
    </Item>
  )
}

export const ATPage: React.FC<{ field: string, pageIndex: number, remove: () => void }> = ({ field, pageIndex, remove }) => {
  const { form } = useFormContext();
  const layoutedDisplaysWatch = useWatch(`${field}.layoutedDisplays`, form);
  const conditionWatch = useWatch(`${field}.condition`, form);
  const layoutStringify = '[' + getLayoutFromLayoutDisplays(layoutedDisplaysWatch).join('+') + ']';
  const keyboardResponseEnabledWatch = useWatch(`${field}.response.keyboard.enabled`, form);

  const onClickConditionButton = () => {
    const conditionField = `${field}.condition`;
    if (form.getFieldValue(conditionField)) {
      form.setFieldValue(conditionField, undefined);
    } else {
      form.setFieldValue(conditionField, ['response', 0, '==', []]);
    }
  };


  const cardTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h4>Page #{pageIndex + 1}</h4>
      <Space size={40}>
        {
          pageIndex !== 0 && (
            <Button
              type={conditionWatch ? 'primary' : 'default'}
              iconOnly icon={<IconBranch />} size='small'
              onClick={onClickConditionButton}
            />
          )
        }
        {/* TODO: Disable delete button when only 1 page. Add 1 page when start */}
        <Button shape='circle' icon={<IconDelete />} status='danger' onClick={remove} />
      </Space>
    </div>
  );

  return (
    <div>
      {
        Boolean(conditionWatch) && (
          <div style={{ display: 'flex' }}>
            <div style={{ borderWidth: 1, borderColor: '#FF8D1F', borderBottomWidth: 0, borderStyle: conditionWatch ? 'dashed' : 'solid', padding: '5px 16px', }}>
              <ATPageCondition field={field} pageIndex={pageIndex} />
            </div>
          </div>
        )
      }
      <Card
        title={cardTitle}
        style={{ borderColor: '#FF8D1F', borderStyle: conditionWatch ? 'dashed' : 'solid' }}
      >
        {/* <Button onClick={() => { try { form.validate([field]) } catch (e) { console.warn(e) } }}>validate</Button> */}

        <Space style={{ margin: '10px 0', width: '100%' }}>
          <IconApps />
          <Text bold>Page layout: {layoutStringify}</Text>
        </Space>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LayoutEditor
            field={`${field}.layoutedDisplays`}
            renderItem={(layoutItemField, row, col) => <ATLayoutItem field={layoutItemField} page={pageIndex} row={row} col={col} />}
            newItem={() => ['blank']}
          />
        </div>

        <Divider style={{}} />

        <Space style={{ margin: '10px 0', width: '100%' }}>
          <IconSkipNext />
          <Text bold>Go to next page when</Text>
        </Space>

        <Space wrap size={[0, -14]} style={{ paddingLeft: 10, width: '100%' }}>
          <Item field={`${field}.response.timeout.enabled`} triggerPropName='checked' layout='inline'>
            <Checkbox>
              <div style={{ display: 'inline-block', width: '10em' }}>After fixed duration</div>
            </Checkbox>
          </Item>
          <Item field={`${field}.response.timeout.duration`} layout='inline' >
            <InputNumber suffix='ms' min={0} style={{ width: 100, minWidth: 60 }} />
          </Item>
        </Space>

        {/* TODO: Space should only wrap 'keys' and 'delayBefore' input, fix all item paddings  */}
        <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
          <Item field={`${field}.response.keyboard.enabled`} triggerPropName='checked' layout='inline'>
            <Checkbox>
              <div style={{ display: 'inline-block', width: '10em' }}>Keyboard response</div>
            </Checkbox>
          </Item>
          {
            keyboardResponseEnabledWatch && [
              <Item field={`${field}.response.keyboard.keys`} label='Accepted keys' layout='inline' >
                <AcceptedKeys />
              </Item>,
              <Item field={`${field}.response.keyboard.delayBefore`} label='Delay before accepting keyboard' layout='inline' >
                <InputNumber suffix='ms' min={0} style={{ width: 100, minWidth: 60 }} />
              </Item>
            ]
          }
        </Space>

      </Card >
    </div>
  )
};

export const ATPageInterval: React.FC<{ field: string }> = ({ field }) => {
  return (
    <Space>
      <IconArrowFall style={{ fontSize: 20, color: '#FF8D1F', verticalAlign: 'middle' }} />
      <Item field={field} label='Interval' layout='inline' style={{ marginBottom: 0 }}>
        <InputNumber suffix='ms' min={0} style={{ width: 100, minWidth: 60 }} />
      </Item>
    </Space>
  );
};



export const AdvancedTimeline: React.FC = () => {
  return (
    <Card style={{ textAlign: 'left' }}>
      <List field='advancedTimeline.pages' noStyle>{
        (fields, { add, remove }) => <>
          <Space direction='vertical' size='medium' style={{ width: '100%' }}>
            {/* <IconArrowDown style={{ fontSize: 24, color: '#FF8D1F', verticalAlign: 'middle' }} /> */}

            <Typography style={{ color: '#FF8D1F' }}>Start Trial</Typography>
            <IconArrowFall style={{ fontSize: 20, color: '#FF8D1F' }} />
            {
              fields.map(({ key, field }, index) => [
                <ATPage field={field} pageIndex={index} key={key} remove={() => remove(index)} />,
                index !== fields.length - 1 && <ATPageInterval field={`${field}.interval`} />
              ])
            }
            <Button type='outline' icon={<IconPlus />} onClick={() => add(emptyPage)} style={{ color: '#FF8D1F', borderColor: '#FF8D1F' }}>Add page</Button>
          </Space>
        </>
      }</List>
    </Card>
  );
};

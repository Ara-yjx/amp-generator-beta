import { Button, Card, Checkbox, Divider, Form, InputNumber, Select, Space, Switch, Tag, Typography } from '@arco-design/web-react';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconApps, IconArrowFall, IconBranch, IconDelete, IconEdit, IconPlus, IconSkipNext } from '@arco-design/web-react/icon';
import { range } from 'lodash';
import React, { Fragment } from 'react';
import type { AT, AmpParams } from '../data/ampTypes';
import useOptionGuards from '../hooks/useOptionGuard';
import { flatMap2d, forEach2d, getDisplayKey, getLayoutFromLayoutDisplays } from '../util/util';
import { AcceptedKeys } from './acceptedKeys';
import { LayoutEditor } from './layoutEditor';

const { Item, List } = Form;
const { Text, Title } = Typography;

const emptyLayoutedDisplayItem = (): AT.LayoutedDisplayItem => ({
  displaySrc: ['blank'],
  mouseClick: true,
  // although it's convenient to make all items clickable by default
  // a more semantic way is: when response.mouseClick->true, item.mouseClick ??= true
});

const emptyPage = (): AT.Page => ({
  // layout: [1],
  // displays: [{ row: 1, col: 1, src: null }],
  layoutedDisplays: [[emptyLayoutedDisplayItem()]],
  response: {
    keyboard: { enabled: false, keys: [], delayBefore: 0, delayAfter: 0 },
    timeout: { enabled: true, duration: 1000 },
    mouseClick: { enabled: false },
  },
  interval: 0,
});

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
  const selectedPageWatch = pagesWatch?.[conditionWatch[1]];
  const selectedPageResponseWatch = selectedPageWatch?.response;
  // const selectedPageResponseWatch = useWatch(`advancedTimeline.pages[${conditionWatch[1]}].response`, form) as AT.Page['response'] | undefined;
  // console.log('selectedPageResponseWatch', `advancedTimeline.pages[${conditionWatch[1]}].response`, selectedPageResponseWatch)
  const conditionResponseOptions = [];
  if (selectedPageResponseWatch?.timeout.enabled) {
    conditionResponseOptions.push({ label: `Fixed duration`, value: '_AP' }) // todo : change to "TIMEOUT"
  }
  if (selectedPageResponseWatch?.keyboard.enabled) {
    selectedPageResponseWatch?.keyboard.keys.map(key =>
      conditionResponseOptions.push({ label: `Keyboard ${key}`, value: key })
    );
  }
  if (selectedPageResponseWatch?.mouseClick.enabled) {
    selectedPageWatch && forEach2d(selectedPageWatch.layoutedDisplays, (displayItem, row, col) => {
      if (displayItem.mouseClick) {
        conditionResponseOptions.push({ label: `Click ${getDisplayKey(row, col)}`, value: `_MOUSE.${row}.${col}` })
      }
    })
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


/** field: advancedTimeline.pages[*].layoutedDisplays[row][col] */
const ATLayoutItem: React.FC<{ field: string, page: number, row: number, col: number, options?: { label: string, value: number }[] }> = ({ field, page, row, col }) => {
  const { form } = useFormContext();
  const poolsWatch = useWatch('stimuli', form) as AmpParams['stimuli'];
  const pagesWatch = useWatch('advancedTimeline.pages', form) as AT.Page[];
  const thisPageWatch = useWatch(`advancedTimeline.pages[${page}]`, form) as AT.Page;
  const poolOptions = poolsWatch.map((_, index) => ({
    label: `Pool ${index + 1}`, value: ['pool', index].join('.')
  }));
  const copyOptions = pagesWatch.slice(0, page).flatMap(({ layoutedDisplays }, pIndex) => (
    flatMap2d(layoutedDisplays, (item, row, col) => ({ item, row, col }))
      .filter(({ item }) => item.displaySrc?.[0] === 'pool')
      .map(({ item, row, col }) => ({
        label: `Copy Page#${pIndex + 1} ${getDisplayKey(row, col)} (Pool ${item.displaySrc![1]! + 1})`,
        value: ['copy', pIndex, row, col].join('.'),
      }))
  ));
  const blankOption = { label: '(blank)', value: 'blank' }
  // TODO: current page copyOptions
  const layoutItemOptions = [blankOption, ...poolOptions, ...copyOptions];

  function deserializeDisplaySrcOption(v: string | undefined): AT.DisplaySrc | undefined {
    if (v === undefined) return undefined;
    const split = v.split('.');
    // Parse string to number except first item;
    const splitToInt = split.map((item, index) => index === 0 ? item : parseInt(item)) as AT.DisplaySrc;
    return splitToInt;
  }
  function serializeDisplaySrcOption(v: AT.DisplaySrc | undefined): string | undefined {
    if (v === undefined) return undefined;
    return v?.join('.') ?? 'null';
  }

  useOptionGuards(`${field}.displaySrc`, layoutItemOptions, { formatter: serializeDisplaySrcOption, defaultValue: ['blank'] });

  return (
    <Space direction='vertical' style={{ border: '1px dashed grey', padding: 5 }}>
      <Tag color='orange' bordered>{getDisplayKey(row, col)}</Tag>
      {/* @ts-ignore */}
      <Item field={`${field}.displaySrc`} normalize={deserializeDisplaySrcOption} formatter={serializeDisplaySrcOption} noStyle>
        <Select
          style={{ width: 240 }}
          options={layoutItemOptions}
        />
      </Item>
      {
        thisPageWatch.swap && (
          <Item field={`${field}.swap`} triggerPropName='checked' noStyle>
            <Checkbox>Swappable</Checkbox>
          </Item>
        )
      }
      {
        thisPageWatch.swap && thisPageWatch.response.keyboard.enabled && (
          <Space>
            <Text>Bind keys</Text>
            <Item field={`${field}.bindKeyboard`} noStyle>
              <AcceptedKeys />
            </Item>
          </Space>
        )
      }
      {
        thisPageWatch.response.mouseClick.enabled && (
          <Item field={`${field}.mouseClick`} triggerPropName='checked' noStyle>
            <Checkbox>Clickable</Checkbox>
          </Item>
        )
      }
    </Space>
  );
};


/** field: advancedTimeline.pages[*] */
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 10 }}>
          <LayoutEditor
            field={`${field}.layoutedDisplays`}
            renderItem={(layoutItemField, row, col) => <ATLayoutItem field={layoutItemField} page={pageIndex} row={row} col={col} />}
            newItem={emptyLayoutedDisplayItem}
          />
        </div>

        <Divider />

        <Space style={{ margin: '10px 0', width: '100%' }}>
          <IconSkipNext />
          <Text bold>Go to next page when</Text>
        </Space>

        <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
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

        <Space wrap size={[0, -18]} style={{ paddingLeft: 10, width: '100%' }}>
          <Item field={`${field}.response.mouseClick.enabled`} triggerPropName='checked' layout='inline'>
            <Checkbox>
              <div style={{ display: 'inline-block' }}>Mouse click response</div>
            </Checkbox>
          </Item>
        </Space>

        <Divider />

        <Space style={{ margin: '10px 0', width: '100%' }}>
          <Item field={`${field}.swap`} noStyle>
            <Switch />
          </Item>
          <Text bold>Swap (shuffle) displays</Text>
        </Space>
        <li>You can randomly swap display items.</li>
        <li>
          When you enable both "swap" and "keyboard response",
          in some settings where a key is used to repesent a stimuli item,
          you may want to reverse the swap to get the participant's actual selection.
          You can do this by binding key(s) to stimuli item.
        </li>
        <li>Each swapped display item must have at least one bind-key, and the bind-keys of different display items must be distinct.</li>
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
              fields.map(({ key, field }, index) => (
                <Fragment key={key}>
                  <ATPage field={field} pageIndex={index} remove={() => remove(index)} />
                  {(index !== fields.length - 1) && <ATPageInterval field={`${field}.interval`} />}
                </Fragment>
              ))
            }
            <Button type='outline' icon={<IconPlus />} onClick={() => add(emptyPage())} style={{ color: '#FF8D1F', borderColor: '#FF8D1F' }}>Add page</Button>
          </Space>
        </>
      }</List>
    </Card>
  );
};

import { Alert, Checkbox, InputNumber, Select, Space } from '@arco-design/web-react';
import { AT } from '../data/ampTypes';
import { AcceptedKeys } from './acceptedKeys';
import { useEffect } from 'react';


interface ConditionalShowHideProps {
  type: 'show' | 'hide';
  element: AT.FreeformLayout.ElementDisplayItem;
  elements: AT.FreeformLayout.ElementDisplayItem[];
  value?: AT.ConditionalShowHide;
  onChange?: (v: AT.ConditionalShowHide | undefined) => void;
  /** Keys from AT.Page.response.keyboard, used to warn about overlapping keyboard triggers */
  pageResponseKeyboardKeys?: string[];
}

/**
 * value type: AT.ConditionalShowHide
 */
export function ConditionalShowHide({ type, element, elements, value, onChange, pageResponseKeyboardKeys }: ConditionalShowHideProps) {
  const set = (patch: Partial<AT.ConditionalShowHide> | null) =>
    onChange?.(patch === null ? undefined : { ...value, ...patch });

  // Cannot click self to show, but can click self to hide
  const mouseClickOptionElements = elements.filter(e => type === 'hide' || e !== element);

  // Option guard requires "field" pattern, not "value/onChange" pattern. Create a simple one.
  // TODO: the option guard won't work until this element is rendered. We need to refactor with store.
  const mouseClickOptionElementUids = mouseClickOptionElements.map(e => String(e.uid));
  const valueMouseClickUids = value?.mouseClick ? Object.keys(value.mouseClick) : [];
  useEffect(() => {
    if (value?.mouseClick) {
      const validMouseClickUids = valueMouseClickUids.filter(uid => mouseClickOptionElementUids.includes(uid));
      if (validMouseClickUids.length !== valueMouseClickUids.length) {
        const fixedMouseClick = Object.fromEntries(validMouseClickUids.map(uid => [uid, {}])); 
        console.log('ConditionalShowHide manual option guard: ', value.mouseClick,  '->', fixedMouseClick);
        set({ mouseClick: fixedMouseClick });
      }
    }
  }, [Boolean(value?.mouseClick), JSON.stringify(mouseClickOptionElementUids), JSON.stringify(valueMouseClickUids)]);


  const invalidKeyboardKeys = (value?.keyboard?.keys ?? []).filter(
    k => pageResponseKeyboardKeys?.includes(k)
  );

  const invalidTriggerMouseClickElements = value?.mouseClick
    ? elements
      .filter(e => String(e.uid) in value.mouseClick! && e.displayItem.mouseClick)
    : [];

  return (
    <Space direction='vertical' size='mini'>

      <div>
        <Checkbox
          checked={value?.timeout !== undefined}
          onChange={checked => set(checked ? { timeout: { duration: 1000 } } : { timeout: undefined })}
        >
          After fixed duration
        </Checkbox>
        {value?.timeout && (
          <InputNumber
            suffix='ms'
            min={0}
            style={{ width: 100 }}
            value={value.timeout.duration}
            onChange={v => set({ timeout: { duration: v } })}
          />
        )}
      </div>

      <div>
        <Checkbox
          checked={value?.keyboard !== undefined}
          onChange={checked => set(checked ? { keyboard: { keys: [] } } : { keyboard: undefined })}
        >
          Keyboard
        </Checkbox>
        {value?.keyboard && (
          <>
            <AcceptedKeys
              value={value.keyboard.keys}
              onChange={keys => set({ keyboard: { keys: keys ?? [] } })}
            />
            {invalidKeyboardKeys.length > 0 && (
              <Alert
                type='warning'
                content={`Key(s) ${JSON.stringify(invalidKeyboardKeys)} are also used for page response. Pressing them will trigger both this condition and the page transition.`}
                style={{ marginTop: 4, fontSize: '0.8em' }}
              />
            )}
          </>
        )}
      </div>

      <div>
        <Checkbox
          checked={value?.mouseClick !== undefined}
          onChange={checked => set(checked ? { mouseClick: {} } : { mouseClick: undefined })}
        >
          Mouse click on element
        </Checkbox>
        {value?.mouseClick && (
          <>
            <Select
              mode='multiple'
              options={mouseClickOptionElements.map(e => ({ label: e.name, value: e.uid }))}
              value={Object.keys(value.mouseClick).map(Number)}
              onChange={(uids: number[]) => set({ mouseClick: Object.fromEntries(uids.map(uid => [String(uid), {}])) })}
              style={{ width: '100%' }}
              placeholder='Select elements...'
            />
            {invalidTriggerMouseClickElements.length > 0 && (
              <Alert
                type='warning'
                content={`Clicking on ${JSON.stringify(invalidTriggerMouseClickElements.map(e => e.name))} will trigger page transition, thus they cannot be used for conditional show/hide.`}
                style={{ marginTop: 4, fontSize: '0.8em' }}
              />
            )}
          </>
        )}
      </div>

      <div>
        <Checkbox
          checked={value?.mouseStasis !== undefined}
          onChange={checked => set(checked ? { mouseStasis: { duration: 3000 } } : { mouseStasis: undefined })}
        >
          Mouse no movement
        </Checkbox>
        {value?.mouseStasis && (
          <InputNumber
            suffix='ms'
            min={0}
            style={{ width: 100 }}
            value={value.mouseStasis.duration}
            onChange={v => set({ mouseStasis: { duration: v } })}
          />
        )}
      </div>

    </Space>
  );
}
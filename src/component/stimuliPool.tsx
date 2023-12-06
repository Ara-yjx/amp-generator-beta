import { Form, Tabs } from '@arco-design/web-react';
import React, { useState } from 'react';
import type { AmpStimuli } from '../data/ampTypes';
import { uid } from '../data/uid';
import { StimuliImage } from './stimuliImage';


const { TabPane } = Tabs;

type DraggableTitleProps<T> = React.PropsWithChildren<{
  dragPayload: T,
  ondragstart?: (payload: T) => any;
  ondrop?: (payload: T) => any,
}>

const DraggableTitle = <T,>({ dragPayload, ondragstart, ondrop, children }: DraggableTitleProps<T>) => {
  const onDragStart: React.DragEventHandler<HTMLSpanElement> = e => {
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'move';
    ondragstart?.(dragPayload);
  };
  const onDragOver: React.DragEventHandler<HTMLSpanElement> = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop: React.DragEventHandler<HTMLSpanElement> = e => {
    e.preventDefault();
    const payload = e.dataTransfer.getData('application/json');
    ondrop?.(JSON.parse(payload));
  };
  return (
    <span
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} 
      style={{ padding: 10, margin: -10, } /* larger draggable area */}
    >
      {children}
    </span>
  )
};

export const StimuliPool: React.FC<{}> = ({ }) => {

  const [activeStimuliTab, setActiveStimuliTab] = useState(0);
  const newStimuli: AmpStimuli = {
    items: [{ type: 'text', content: '', count: 1, uid: uid() }],
    shuffle: false, isEnablePriming: false, prime: []
  };

  return (
    <Form.List field='stimuli' >
      {
        (fields, { add, remove, move }) => (
          <Tabs
            activeTab={`${activeStimuliTab}`}
            onChange={tabKeyStr => setActiveStimuliTab(parseInt(tabKeyStr))}
            type='card-gutter'
            editable
            react-dnd
            onAddTab={() => { add({ ...newStimuli }); setActiveStimuliTab(fields.length); }}
            onDeleteTab={tabKeyStr => {
              const tabKey = parseInt(tabKeyStr);
              if (window.confirm(`⚠️⚠️⚠️ Are you sure to delete Stimuli ${tabKey + 1} and all its primings completely?`)) {
                remove(tabKey);
                if (fields.length === 1) { // keep at least one tab
                  add({ ...newStimuli });
                } else if (tabKey === fields.length - 1) { // if remove last tab, focus on prev tab
                  setActiveStimuliTab(tabKey - 1);
                }
              }
            }}
          >
            {
              fields.map(({ field }, index) => (
                <TabPane key={index} style={{ padding: 15 }} title={
                  <DraggableTitle
                    dragPayload={index}
                    ondragstart={setActiveStimuliTab}
                    ondrop={payload => { move(payload, index); setActiveStimuliTab(index); }}>
                    Stimuli {index + 1}
                  </DraggableTitle>
                }>
                  <StimuliImage field={field} />
                </TabPane>
              ))
            }
          </Tabs>
        )
      }
    </Form.List>
  )
};

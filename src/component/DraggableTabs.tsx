import { Form, Tabs } from '@arco-design/web-react';
import React, { useState } from 'react';

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

interface DraggableTabsProps<T = any> {
  field: string;
  renderTab: React.FC<{ field: string, index: number }>; // (props: { field: string, index: number }) => React.ReactNode;
  renderTitle: React.FC<{ field: string, index: number }>; // (props: { field: string, index: number }) => React.ReactNode;
  provideNewTab?: (index: number) => T;
  warningOnDelete?: (index: number) => string;
}

export const DraggableTabs: React.FC<DraggableTabsProps> = (props) => {

  const [activeStimuliTab, setActiveStimuliTab] = useState(0);
  return (
    <Form.List field={props.field} >
      {
        (fields, { add, remove, move }) => (
          <Tabs
            activeTab={`${activeStimuliTab}`}
            onChange={tabKeyStr => setActiveStimuliTab(parseInt(tabKeyStr))}
            type='card-gutter'
            editable
            onAddTab={() => { add(props.provideNewTab ? props.provideNewTab(fields.length) : null); setActiveStimuliTab(fields.length); }}
            onDeleteTab={tabKeyStr => {
              const tabKey = parseInt(tabKeyStr);
              if (props.warningOnDelete && window.confirm(props.warningOnDelete(tabKey))) {
                remove(tabKey);
                if (fields.length === 1) { // keep at least one tab
                  add(props.provideNewTab ? props.provideNewTab(0) : null);
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
                    {
                      <props.renderTitle field={field} index={index} />
                    }
                  </DraggableTitle>
                }>
                  {
                    <props.renderTab field={field} index={index} />
                  }
                </TabPane>
              ))
            }
          </Tabs>
        )
      }
    </Form.List>
  )
};

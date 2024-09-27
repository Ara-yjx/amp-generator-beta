import { Button, Form, Grid, Modal, Select, Tag } from '@arco-design/web-react';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconEdit } from '@arco-design/web-react/icon';
import React from 'react';
import type { AmpStimuli, ConcurrentDisplayFrame } from '../data/ampTypes';
import { AddRemoveButtons } from './addRemoveButtons';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';
import { getDisplayKey } from '../util/util';

const ROW_HEIGHT = 100;

const { Row, Col } = Grid;

const ContentPoolSelector: React.FC<{ field: string, rowIndex: number, colIndex: number }> = ({ field, rowIndex, colIndex }) => {
  const { form } = Form.useFormContext();
  const stimuliWatch = Form.useWatch('stimuli', form) as AmpStimuli[];

  const options = [
    ...stimuliWatch.map((v, index) => ({
      label: `Stimuli Pool ${index + 1}`,
      value: index,
    })),
    { label: '(empty)', value: 'empty' }
  ];
  const margin = 10;
  return (
    <div style={{ display: 'inline-block', width: 140, height: ROW_HEIGHT - margin * 2, margin: margin, border: '1px solid grey', backgroundColor: 'white' }}>
      <Tag color='orange' bordered>{getDisplayKey(rowIndex, colIndex)}</Tag>

      <Form.Item field={field}>
        <Select options={options} style={{ width: 140 }} />
      </Form.Item>
    </div>
  )
}



export const ConcurrentDisplayFrameEditor: React.FC<{ field: string }> = ({ field }) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const { form } = useFormContext();
  const layout = useWatch(field, form) as ConcurrentDisplayFrame;
  const textPreview = layout?.map(row => {
    const colTexts = row.map(c => typeof c === 'number' ? `Pool${c + 1}` : c);
    return `[${colTexts.join(', ')}]`;
  }).join(' / ');

  return (
    <span>
      Stimuli Pools: {textPreview}
      <Button type='text' icon={<IconEdit style={{ color: 'rgb(var(--orange-6))' }} />} onClick={() => setIsModalVisible(true)} />
      <Modal

        title='Display Layout'
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={(cancel, ok) => ok} // hide cancel button
        style={{ minWidth: '70vw' }}
      >
        <p>You can customize the number of rows, and the number of stimuli contents in each row.</p>
        <p>If you select same stimuli pool twice, then two items will be picked from the pool. And the pool size should be {'>='} (2 * Number of total trials).</p>
        <span style={{ color: 'rgb(var(--orange-6))' }}>Trial Question Container</span>
        <Row>
          {/* Row items */}
          <Col span={18}>
            <div>
              <Form.List field={field}>{
                (rowFields, { add, remove }) => (
                  <>
                    <div style={{ border: '1px solid rgb(var(--orange-6))', marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {
                        rowFields.map((rowField, rowIndex) => (
                          <div key={rowField.key} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <Form.List field={rowField.field}>{
                              colFields => (
                                colFields.map((colField, colIndex) => (
                                  <ContentPoolSelector field={colField.field} key={colField.key} rowIndex={rowIndex} colIndex={colIndex} />
                                ))
                              )
                            }</Form.List>
                          </div>
                        ))
                      }
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
                      <AddRemoveButtons onAdd={() => add(['empty'])} onRemove={() => remove(rowFields.length - 1)} />
                    </div>
                  </>
                )
              }</Form.List>
            </div>
          </Col>
          {/* AddRemove buttons */}
          <Col span={6} style={{ paddingLeft: 10 }}>
            <Form.List field={field}>
              {
                (rowFields, rowActions) => (
                  rowFields.map((rowField, rowIndex) => (
                    <Form.List field={rowField.field} key={rowField.key}>{
                      (colFields, colActions) => (
                        <div style={{ height: ROW_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <AddRemoveButtons
                            onAdd={() => colActions.add('empty')}
                            onRemove={() => colFields.length === 1 ? rowActions.remove(rowIndex) : colActions.remove(colFields.length - 1)}
                          />
                        </div>
                      )
                    }</Form.List>
                  ))
                )
              }
            </Form.List>
          </Col>
        </Row>
        <p>To configure the gap width between contents, please go to "Trial Block HTML".</p>
      </Modal>
    </span>
  );
};

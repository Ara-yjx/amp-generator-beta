import { Button, Form, Grid, Modal, Select, Space } from '@arco-design/web-react';
import useWatch from '@arco-design/web-react/es/Form/hooks/useWatch';
import { IconEdit } from '@arco-design/web-react/icon';
import React, { CSSProperties, ReactNode } from 'react';
import type { AmpStimuli, ConcurrentDisplayFrame } from '../data/ampTypes';
import { AddRemoveButtons } from './addRemoveButtons';
import useFormContext from '@arco-design/web-react/es/Form/hooks/useContext';



export const LayoutEditor: React.FC<{
  field: string,
  style?: CSSProperties,
  renderItem?: (field: string, row: number, col: number) => ReactNode,
  newItem?: () => any,
}> = ({ field, style, renderItem, newItem }) => {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', ...style }}>
      <Form.List field={field}>{
        (rowFields, rowOp) => (
          <>
            <div style={{ border: '1px solid grey', padding: 10 }}>
              {
                rowFields.map((rowField, rowIndex) => (
                  <div key={rowField.key}>
                    <Form.List field={rowField.field}>{
                      (colFields, colOp) => (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {
                            colFields.map((colField, colIndex) => (
                              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }} key={colField.key}>
                                {renderItem?.(colField.field, rowIndex, colIndex)}
                              </div>
                            ))
                          }
                          <div style={{ width: 1 }}>
                            <AddRemoveButtons
                              style={{ marginLeft: 20 }}
                              size='mini'
                              onAdd={() => colOp.add(newItem?.())}
                              onRemove={() => colOp.remove(colFields.length - 1)}
                              disableRemove={colFields.length <= 1}
                            />
                          </div>
                        </div>
                      )
                    }</Form.List>
                  </div>
                ))
              }
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AddRemoveButtons
                style={{ marginTop: 10 }}
                size='mini'
                onAdd={() => rowOp.add([newItem?.()])}
                onRemove={() => rowOp.remove(rowFields.length - 1)}
                disableRemove={rowFields.length <= 1}
              />
            </div>
          </>
        )
      }</Form.List>
    </div>
  )

}

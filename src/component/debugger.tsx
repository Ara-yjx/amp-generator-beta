import JsonView from '@uiw/react-json-view';
import React from 'react';
import { Form } from '@arco-design/web-react';
import { createPortal } from 'react-dom';

export const Debugger: React.FC = () => {
  return (
    <Form.Item noStyle shouldUpdate>
      {
        values => createPortal((
          <div style={{ position: 'fixed', top: '10%', left: 0 }}>
            <JsonView value={values} collapsed={1} enableClipboard={false} displayDataTypes={false} />
          </div>
        ), document.body)
      }
    </Form.Item>
  );
};

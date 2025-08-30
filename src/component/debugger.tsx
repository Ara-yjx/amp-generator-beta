import JsonView from '@uiw/react-json-view';
import React from 'react';
import { Button, Form } from '@arco-design/web-react';
import { createPortal } from 'react-dom';
import { IconSwap } from '@arco-design/web-react/icon';

export const Debugger: React.FC = () => {
  const [toLeft, setToLeft] = React.useState(true);
  return (
    <Form.Item noStyle shouldUpdate>
      {
        values => createPortal((
          <div style={{
            position: 'fixed', top: '10%', zIndex: 2000, // Arco Modal's z-index is 1001
            ...(toLeft ? { left: 0 } : { right: 0 })
          }}>
            <Button icon={<IconSwap />} onClick={() => setToLeft(!toLeft)}></Button>
            <JsonView value={values} collapsed={1} enableClipboard={false} displayDataTypes={false} />
          </div>
        ), document.body)
      }
    </Form.Item>
  );
};

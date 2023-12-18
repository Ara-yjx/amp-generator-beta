import React, { useEffect } from 'react';
import '@arco-design/web-react/dist/css/arco.css';
import { ConfigProvider, Layout } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { MainForm } from './component/mainForm';
import './App.css';

function warnBeforeUnload() {
  return 'Leaving the page will reset all settings. Have you saved your settings?';
};

function App() {
  useEffect(() => {
    window.onbeforeunload = warnBeforeUnload;
  });

  return (
    <ConfigProvider locale={enUS}>
      <div className="App">
        <Layout style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Layout.Header>
            <h1>SPT Generator</h1>
          </Layout.Header>
          <Layout.Content>
            <MainForm />
          </Layout.Content>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

export default App;

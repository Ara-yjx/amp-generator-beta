import React from 'react';
import '@arco-design/web-react/dist/css/arco.css';
import { Layout } from '@arco-design/web-react';
import { MainForm } from './component/mainForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <Layout style={{ maxWidth: 800, margin: '0 auto' }}>
        <Layout.Header>
          <h1>AMP Generator</h1>
        </Layout.Header>
        <Layout.Content>
          <MainForm />
        </Layout.Content>
      </Layout>
    </div>
  );
}

export default App;

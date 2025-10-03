import { ConfigProvider, Layout } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { useEffect } from 'react';
import Header from './component/header';
import { MainForm } from './component/mainForm';
import './App.css';
import '@arco-design/web-react/dist/css/arco.css';
import { BrowserRouter, Route, Routes } from 'react-router';

function warnBeforeUnload() {
  return 'Leaving the page will reset all settings. Have you saved your settings?';
};

function App() {
  useEffect(() => {
    window.onbeforeunload = warnBeforeUnload;
  }, []);

  return (
    <ConfigProvider locale={enUS}>
      <div className="App">
        <Layout style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Layout.Header>
            <Header />
          </Layout.Header>
          <Layout.Content>
            <BrowserRouter>
              <Routes>
                <Route path='/' element={<MainForm />} />
                <Route path='/experiment/:expId?/edit' element={<MainForm />} />
              </Routes>
            </BrowserRouter>
          </Layout.Content>
        </Layout>
      </div>
    </ConfigProvider>
  );
}

export default App;

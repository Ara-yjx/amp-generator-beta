import { ConfigProvider, Layout } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import Header from './component/header';
import { MainForm } from './component/mainForm';
import './App.css';
import '@arco-design/web-react/dist/css/arco.css';
import { HashRouter, Route, Routes } from 'react-router';
import Dashboard from './component/dashboard';
import LoginPage from './component/loginPage';


function App() {
  let baseRoute;
  try {
    baseRoute = new URL(process.env.PUBLIC_URL).pathname;
  } catch {}
  console.log('baseRoute: ', baseRoute);
  return (
    <ConfigProvider locale={enUS}>
      <HashRouter basename={baseRoute}>
        <div className="App">
          <Layout>
            <Layout.Header>
              <Header />
            </Layout.Header>
            <Layout.Content>
              <Routes>
                <Route path='/' element={<MainForm />} />
                <Route path='/experiment/:expId?/edit' element={<MainForm />} />
                <Route path='/my' element={<Dashboard />} />
                <Route path='/login' element={<LoginPage />} />
              </Routes>
            </Layout.Content>
          </Layout>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;

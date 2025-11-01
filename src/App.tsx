import { ConfigProvider, Layout } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { useContext } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import './App.css';
import Dashboard from './component/dashboard';
import Header from './component/header';
import LoginPage from './component/loginPage';
import { MainForm } from './component/mainForm';
import { AuthContext } from './context/AuthContext';


function App() {
  let baseRoute;
  try {
    baseRoute = new URL(process.env.PUBLIC_URL).pathname;
  } catch { }
  console.log('baseRoute: ', baseRoute);

  const { authState } = useContext(AuthContext);

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
                <Route path='/my' element={authState ? <Dashboard /> : <Navigate to='/login' />} />
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

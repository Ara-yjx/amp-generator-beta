import { ConfigProvider, Layout } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { useContext } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import './App.css';
import Dashboard from './component/dashboard';
import Header from './component/header';
import HomePage from './component/homePage';
import LoginPage from './component/loginPage';
import { MainForm } from './component/mainForm';
import Teams from './component/teams';
import { AuthContext } from './context/AuthContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout>
    <Layout.Header>
      <Header />
    </Layout.Header>
    <Layout.Content>
      {children}
    </Layout.Content>
  </Layout>
);

function App() {

  const { authState } = useContext(AuthContext);

  return (
    <ConfigProvider locale={enUS}>
      <HashRouter>
        <div className="App">
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/exp' element={<AppLayout><MainForm /></AppLayout>} />
            <Route path='/exp/:expId?/edit' element={<AppLayout><MainForm /></AppLayout>} />
            <Route path='/my' element={authState ? <AppLayout><Dashboard /></AppLayout> : <Navigate to='/login' />} />
            <Route path='/team' element={authState ? <AppLayout><Teams /></AppLayout> : <Navigate to='/login' />} />
            <Route path='/login' element={<AppLayout><LoginPage /></AppLayout>} />
          </Routes>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;

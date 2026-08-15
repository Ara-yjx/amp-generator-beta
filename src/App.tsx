import { ConfigProvider, Layout } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { HashRouter, Route, Routes } from 'react-router';
import './App.css';
import Dashboard from './component/dashboard';
import ChatroomEditor from './component/chatroom/ChatroomEditor';
import ChatroomList from './component/chatroom/ChatroomList';
import ChatroomUsage from './component/chatroom/ChatroomUsage';
import Header from './component/header';
import HomePage from './component/homePage';
import LoginPage from './component/loginPage';
import { MainForm } from './component/mainForm';
import RequireAuth from './component/requireAuth';
import Teams from './component/teams';
import WorkspaceMenu from './component/workspaceMenu';

const AppLayout: React.FC<{ children: React.ReactNode; showWorkspaceMenu?: boolean }> = ({
  children,
  showWorkspaceMenu = true,
}) => (
  <Layout className="app-layout">
    <Layout.Header>
      <Header />
    </Layout.Header>
    {showWorkspaceMenu && <WorkspaceMenu />}
    <Layout.Content className="app-layout-content">
      {children}
    </Layout.Content>
  </Layout>
);

function App() {
  return (
    <ConfigProvider locale={enUS}>
      <HashRouter>
        <div className="App">
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/exp' element={<AppLayout><MainForm /></AppLayout>} />
            <Route path='/exp/:expId?/edit' element={<AppLayout><MainForm /></AppLayout>} />
            <Route path='/my' element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
            <Route path='/team' element={<RequireAuth><AppLayout><Teams /></AppLayout></RequireAuth>} />
            <Route path='/chatroom' element={<RequireAuth><AppLayout><ChatroomList /></AppLayout></RequireAuth>} />
            <Route path='/chatroom/:id/usage' element={<RequireAuth><AppLayout><ChatroomUsage /></AppLayout></RequireAuth>} />
            <Route path='/chatroom/:id' element={<RequireAuth><AppLayout><ChatroomEditor /></AppLayout></RequireAuth>} />
            <Route path='/login' element={<AppLayout showWorkspaceMenu={false}><LoginPage /></AppLayout>} />
          </Routes>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;

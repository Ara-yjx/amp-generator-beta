import { Menu } from '@arco-design/web-react';
import { useLocation, useNavigate } from 'react-router';

export type WorkspaceMenuKey = 'experiments' | 'chatrooms';

export function selectedWorkspaceMenu(pathname: string): WorkspaceMenuKey | null {
  if (pathname === '/my' || pathname.startsWith('/exp')) return 'experiments';
  if (pathname.startsWith('/chatroom')) return 'chatrooms';
  return null;
}

export default function WorkspaceMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const selected = selectedWorkspaceMenu(location.pathname);

  return (
    <Menu
      mode="horizontal"
      selectedKeys={selected ? [selected] : []}
      onClickMenuItem={(key) => {
        if (key === 'experiments') navigate('/my');
        if (key === 'chatrooms') navigate('/chatroom');
      }}
      style={{ borderTop: '1px solid #f2f3f5', borderBottom: '1px solid #e5e6eb' }}
    >
      <Menu.Item key="experiments">Experiments</Menu.Item>
      <Menu.Item key="chatrooms">Chatrooms</Menu.Item>
    </Menu>
  );
}

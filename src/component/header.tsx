import LoginModal from './loginModal';
import AgentNavLink from './chatbot/agentNavLink';
import NavButtonDropdown from './navButtonDropdown';
import NavigationLinks from './navigationLinks';
import { Divider, Space } from '@arco-design/web-react';

function Header() {
  return (
    <div>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <NavButtonDropdown />
      </div>

      <h1 style={{ color: '#3491FA', letterSpacing: 1 }}>STIMULIZE</h1>
      <div style={{ marginBottom: 30 }}>
        <Space split={<Divider type='vertical' />}>
          <NavigationLinks showDividers={false} />
          <AgentNavLink />
        </Space>
      </div>

      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LoginModal />
      </div>
    </div>
  );
}

export default Header;

import { Link } from '@arco-design/web-react';
import { IconCustomerService } from '@arco-design/web-react/icon';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { openChatbotDrawer } from './chatbotControl';

/**
 * Top navigation link to open the Stimulize AI Assistant drawer.
 * Only rendered when the user is logged in.
 */
export default function AgentNavLink() {
  const { authState } = useContext(AuthContext);

  if (!authState) {
    return null;
  }

  return (
    <Link
      icon={<IconCustomerService />}
      onClick={(event) => {
        event.preventDefault();
        openChatbotDrawer();
      }}
    >
      Agent
    </Link>
  );
}

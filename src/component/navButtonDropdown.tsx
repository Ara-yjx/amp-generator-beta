import { Button, Dropdown, Link, Menu } from '@arco-design/web-react';
import { IconHome, IconUserGroup } from '@arco-design/web-react/icon';
import { useHref, useLocation, useMatch } from 'react-router';


const NavButtonDropdown = () => {

  const homeHref = useHref('/my');
  const teamHref = useHref('/team');

  // Decide whether to open page in new tab. A little bit hack here by self-checking location
  const isEditorPage = useMatch('/exp/:expId?/edit');
  const isLocalEditorPage = useMatch('/exp');
  const isTargetBlank = isEditorPage || isLocalEditorPage;

  return (
    <Dropdown
      droplist={
        <Menu>
          <Menu.Item key='/my'>
            <Link href={homeHref} target={isTargetBlank ? '_blank' : undefined}>
              <IconHome /> &nbsp; Home
            </Link>
          </Menu.Item>
          <Menu.Item key='/team'>
            <Link href={teamHref} target={isTargetBlank ? '_blank' : undefined}>
              <IconUserGroup /> &nbsp; Teams
            </Link>
          </Menu.Item>
        </Menu>
      }
      position='bl'
    >
      <Button icon={<IconHome />} href={homeHref} target={isTargetBlank ? '_blank' : undefined} />
    </Dropdown>
  );
};

export default NavButtonDropdown;

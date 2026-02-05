import { Button, Dropdown, Link, Menu } from '@arco-design/web-react';
import { IconCompass, IconHome, IconUserGroup } from '@arco-design/web-react/icon';
import { useHref, useMatch } from 'react-router';


const NavButtonDropdown = () => {

  const homeHref = useHref('/my');
  const teamHref = useHref('/team');
  const rootHref = useHref('/');

  // Decide whether to open page in new tab. A little bit hack here by self-checking location
  // local editor -> new tab 
  // cloud editor -> same tab
  // others -> same tab
  const isCloudEditorPage = useMatch('/exp/:expId?/edit');  
  const target = isCloudEditorPage ? '_self' : '_blank';

  return (
    <Dropdown
      droplist={
        <Menu>
          <Menu.Item key='/my'>
            <Link href={homeHref} target={target}>
              <IconHome /> &nbsp; Home
            </Link>
          </Menu.Item>
          <Menu.Item key='/team'>
            <Link href={teamHref} target={target}>
              <IconUserGroup /> &nbsp; Teams
            </Link>
          </Menu.Item>
          <Menu.Item key='/'>
            <Link href={rootHref} target={target}>
              <IconCompass /> &nbsp; STIMULIZE
            </Link>
          </Menu.Item>
        </Menu>
      }
      position='bl'
    >
      <Button icon={<IconHome />} href={homeHref} target={target} />
    </Dropdown>
  );
};

export default NavButtonDropdown;

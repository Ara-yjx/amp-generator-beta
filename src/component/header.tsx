import { Button, Divider, Link, Modal, Space, Typography } from '@arco-design/web-react';
import { IconBook, IconCheckCircle, IconEmail, IconPen, IconQuestionCircle } from '@arco-design/web-react/icon';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import cite from '../data/cite';

const { Title, Paragraph } = Typography;


function Header() {

  const [isCiteModalVisible, setIsCiteModalVisible] = useState(false);
  const [isCiteCopied, setIsCiteCopied] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);

  return (
    <>
      <h1 style={{ color: '#3491FA', letterSpacing: 1 }}>STIMULIZE</h1>
      <Space split={<Divider type='vertical' />} style={{ marginBottom: 30 }}>
        <Link href='./SP-Builder_User_Manual_20240307.pdf' target='_blank' icon={<IconBook />}>
          User manual
        </Link>
        <Link href='./SP-Builder_FAQ.pdf' target='_blank' icon={<IconQuestionCircle />}>
          FAQ
        </Link>
        <Link icon={<IconPen />} onClick={() => { setIsCiteModalVisible(true); setIsCiteCopied(false); }}>
          How to cite us
        </Link>
        <Link icon={<IconEmail />} onClick={() => setIsContactModalVisible(true)}>
          Contact us
        </Link>
      </Space>
      {
        createPortal((
          <Modal
            visible={isCiteModalVisible}
            onCancel={() => setIsCiteModalVisible(false)}
            footer={null}
          >
            <Paragraph>
              The STIMULIZE web application is licensed under
              <Link href="http://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style={{ display: 'inline-block' }}>
                <Space size='mini'>
                  CC BY-NC-ND 4.0
                  <img style={{ height: '1em', display: 'block', margin: 'auto' }} src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" />
                  <img style={{ height: '1em', display: 'block', margin: 'auto' }} src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" />
                  <img style={{ height: '1em', display: 'block', margin: 'auto' }} src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" />
                  <img style={{ height: '1em', display: 'block', margin: 'auto' }} src="https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1" />
                </Space>
              </Link>
            </Paragraph>
            <Title heading={6}>How to cite us</Title>
            <Paragraph style={{ fontFamily: '"Times New Roman", serif' }}>
              {cite}
            </Paragraph>
            <Button
              type='secondary'
              size='small'
              icon={isCiteCopied ? <IconCheckCircle /> : null}
              status={isCiteCopied ? 'success' : undefined}
              onClick={() => { navigator.clipboard.writeText(cite); setIsCiteCopied(true); }}
            >
              {isCiteCopied ? 'Copied' : 'Copy citation'}
            </Button>
          </Modal>
        ), document.body)
      }
      {
        createPortal((
          <Modal
            visible={isContactModalVisible}
            onCancel={() => setIsContactModalVisible(false)}
            footer={null}
          >
            <Paragraph>
              Please send email to <Link href='mailto://spbuilder.team@gmail.com' target='_blank'>spbuilder.team@gmail.com</Link>
            </Paragraph>
          </Modal>
        ), document.body)
      }
    </>
  );
}

export default Header;

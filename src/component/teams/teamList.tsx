import React, { useEffect, useState } from 'react';
import { List, Button, Modal, Form, Input, Typography, Message, Space } from '@arco-design/web-react';
import { getTeams, createTeam } from '../../data/backend';
import { Team } from '../../data/apiTypes';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';

const { Title, Text } = Typography;

const TeamList: React.FC<{ 
  focusedTeam: Team | null; 
  setFocusedTeam: (team: Team | null) => void;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}> = ({ focusedTeam, setFocusedTeam, teams, setTeams }) => {
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { teams } = await getTeams();
      console.log('Loaded teams:', teams);
      setTeams(teams ?? []);
    } catch (e) {
      Message.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateOk = async () => {
    try {
      await form.validate();
      const values = form.getFieldsValue() as { name: string; description?: string };
      setCreating(true);
      const { team: created } = await createTeam(values);
      Message.success('Team created');
      setCreateOpen(false);
      form.resetFields();
      setTeams((prev) => [created, ...prev]);
      setFocusedTeam(created);
    } catch (e) {
      if ((e as any)?.error) return;
      Message.error('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align='center' style={{ justifyContent: 'space-between' }}>
        <Title heading={5} style={{ margin: 0 }}>
          Teams
        </Title>
        <Space>
          <Button icon={<IconRefresh />} onClick={loadTeams} loading={loading} />
          <Button icon={<IconPlus />} type='primary' onClick={() => setCreateOpen(true)} />
        </Space>
      </Space>

      <List
        bordered
        loading={loading}
        dataSource={teams}
        render={(item, index) => (
          <List.Item 
            key={(item.id ?? index).toString()} 
            onClick={() => setFocusedTeam(item)}
            style={{ 
              textAlign: 'left', 
              cursor: 'pointer',
              ...(focusedTeam?.id === item.id ? { boxShadow: '0 0 0 2px lightgrey inset' } : {}) 
            }}
          >
            <Title heading={6}>
              {item.name}
            </Title>
            <Text type='secondary'>
              {item.description || 'No description'}
            </Text>
            <br />
            <Text type='secondary'>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : null}
            </Text>
          </List.Item>
        )}
      />

      <Modal
        title='Create Team'
        visible={createOpen}
        onOk={handleCreateOk}
        confirmLoading={creating}
        onCancel={() => setCreateOpen(false)}
        unmountOnExit
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            label='Name'
            field='name'
            rules={[{ required: true, message: 'Please enter a team name' }]}
          >
            <Input placeholder='Team name' allowClear />
          </Form.Item>
          <Form.Item label='Description' field='description'>
            <Input.TextArea
              placeholder='Optional description'
              maxLength={500}
              showWordLimit
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamList;

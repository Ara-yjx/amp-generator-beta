import React, { useEffect, useState } from 'react';
import { List, Button, Modal, Form, Input, Typography, Message, Space } from '@arco-design/web-react';
import { getProjects, createProject } from '../../data/backend';
import { Project } from '../../data/apiTypes';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';

const { Title, Text } = Typography;


const ProjectList: React.FC<{ focusedProject: Project | null; setFocusedProject: (project: Project | null) => void }> = ({ focusedProject, setFocusedProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      console.log('Loaded projects:', data);
      setProjects(data?.projects ?? []);
    } catch (e) {
      Message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateOk = async () => {
    try {
      await form.validate();
      const values = form.getFieldsValue() as { name: string; description?: string };
      setCreating(true);
      const created = await createProject(values);
      Message.success('Project created');
      setCreateOpen(false);
      form.resetFields();
      setProjects((prev) => [created, ...prev]);
    } catch (e) {
      // validation or request error
      if ((e as any)?.error) return; // form validation error already shown by Arco
      Message.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align='center' style={{ justifyContent: 'space-between' }}>
        <Title heading={5} style={{ margin: 0 }}>
          Projects
        </Title>
        <Space>
          <Button icon={<IconRefresh />} onClick={loadProjects} loading={loading} />
          <Button icon={<IconPlus />} type='primary' onClick={() => setCreateOpen(true)} />
        </Space>
      </Space>

      <List
        bordered
        loading={loading}
        dataSource={projects}
        render={(item, index) => (
          <List.Item key={(item.id ?? index).toString()} onClick={() => setFocusedProject(item)}
            style={{ textAlign: 'left', ...(focusedProject?.id === item.id ? { boxShadow: '0 0 0 2px lightgrey inset' } : {}) }}
          >
            <Title heading={6}>
              {item.name}
            </Title>
            <Text type='secondary'>
              {item.description || 'No description'}
            </Text>
            <br />
            <Text type='secondary'>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : null}
            </Text>
          </List.Item>
        )}
      />

      <Modal
        title='Create Project'
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
            rules={[{ required: true, message: 'Please enter a project name' }]}
          >
            <Input placeholder='Project name' allowClear />
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
    </div >
  );
};

export default ProjectList;
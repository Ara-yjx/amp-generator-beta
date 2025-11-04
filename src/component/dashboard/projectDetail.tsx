import React, { useEffect, useMemo, useState } from 'react';
import { Experiment, ExperimentFile, Project } from '../../data/apiTypes';
import { createExperiment, deleteExperiment, getExperimentsByProjectId, getExperimentFiles } from '../../data/backend';
import { Button, Form, Input, Message, Modal, Popconfirm, Space, Table, Typography } from '@arco-design/web-react';
import { IconPlus, IconRefresh, IconDelete, IconEdit } from '@arco-design/web-react/icon';
import { useHref } from 'react-router';

const { Title, Text } = Typography;

export const VersionList: React.FC<{ record: Experiment, index: number }> = ({ record }) => {
  const [files, setFiles] = React.useState<ExperimentFile[]>([]);
  const [loading, setLoading] = React.useState(false);

  const columns = React.useMemo(() => ([
    { title: 'Filename', dataIndex: 'filename' },
    { title: 'Content Type', dataIndex: 'contentType', width: 200 },
    { title: 'Uploaded At', dataIndex: 'uploadedAt', width: 220, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    { title: 'File ID', dataIndex: 'fileId' },
  ]), []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { files } = await getExperimentFiles(record.id);
      setFiles(files ?? []);
    } catch (e) {
      Message.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadFiles();
  }, [record.id]);

  return (
    <Table
      rowKey='fileId'
      columns={columns as any}
      data={files}
      loading={loading}
      pagination={{ pageSize: 5 }}
      border
      size='small'
    />
  );
};

export const ProjectEditButton: React.FC<{ expId: number }> = ({ expId }) => {
  const expHref = useHref(`/exp/${expId}/edit`);
  return (
    <Button type='primary' size='mini' icon={<IconEdit />} href={expHref} target='_blank' />
  );
}

export const ProjectDetail: React.FC<{ project: Project }> = ({ project }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const columns = useMemo(() => ([
    // { title: 'ID', dataIndex: 'id', width: 100 },
    // { title: 'Name', dataIndex: 'name', width: 220 },
    {
      title: 'Build Experiment', dataIndex: 'id', width: 200,
      render: (v: number) => <ProjectEditButton expId={v} />
    },
    { title: 'Description', dataIndex: 'description' },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width: 200,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-')
    },
    {
      title: 'Owner',
      dataIndex: 'isOwner',
      width: 120,
      render: (v: boolean) => (v ? 'Yes' : 'No')
    },
    {
      title: 'Has Access',
      dataIndex: 'hasAccess',
      width: 120,
      render: (v: boolean) => (v ? 'Yes' : 'No')
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      width: 160,
      render: (_: any, record: Experiment) => (
        <Space>
          <Popconfirm
            style={{ width: 300 }}
            focusLock
            title='Delete this experiment?'
            content='This action cannot be undone.'
            onOk={() => handleDelete(record.id)}
          >
            <Button
              size='mini'
              status='danger'
              icon={<IconDelete />}
              loading={deletingId === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]), []);

  const loadExperiments = async () => {
    setLoading(true);
    try {
      const { experiments } = await getExperimentsByProjectId(project.id);
      setExperiments(experiments ?? []);
    } catch (e) {
      Message.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project?.id != null) {
      loadExperiments();
    }
  }, [project?.id]);

  const handleOpenCreate = () => {
    setCreateOpen(true);
    createForm.resetFields();
  };

  const handleCreateSubmit = async () => {
    try {
      await createForm.validate();
      const values = createForm.getFieldsValue() as { name?: string; description?: string };
      setCreating(true);
      const { experiment: exp } = await createExperiment(project.id, values);
      Message.success('Experiment created');
      setExperiments(prev => [exp, ...prev]);
      setCreateOpen(false);
    } catch (e: any) {
      if (e?.error) return; // form validation error already shown
      Message.error('Failed to create experiment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (experimentId: number) => {
    setDeletingId(experimentId);
    try {
      const res = await deleteExperiment(experimentId);
      Message.success((res as any)?.meta?.message || 'Experiment deleted');
      setExperiments(prev => prev.filter(e => e.id !== experimentId));
    } catch (e) {
      Message.error('Failed to delete experiment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align='center' style={{ justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'left' }}>
          <Title heading={2} style={{ margin: 0 }}>Experiments</Title>
          <Title heading={5} style={{ margin: 0 }}>{project.name}</Title>
          <Text type='secondary'>{project.description || 'No description'}</Text>
        </div>
        <Space>
          <Button icon={<IconPlus />} type='primary' onClick={handleOpenCreate}>
            Create Experiment
          </Button>
          <Button icon={<IconRefresh />} onClick={loadExperiments} loading={loading} />
        </Space>
      </Space>

      <Table
        rowKey='id'
        columns={columns as any}
        data={experiments}
        loading={loading}
        pagination={{ pageSize: 10 }}
        border
      // expandedRowRender={(record, index) => <VersionList record={record} index={index} />}
      // expandProps={{
      //   columnTitle: 'Versions',
      //   width: 100,
      // }}
      />

      <Modal
        title='Create Experiment'
        visible={createOpen}
        onOk={handleCreateSubmit}
        confirmLoading={creating}
        onCancel={() => setCreateOpen(false)}
        unmountOnExit
      >
        <Form form={createForm} layout='vertical'>
          {/* <Form.Item label='Name' field='name' rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input placeholder='Experiment name' allowClear />
          </Form.Item> */}
          <Form.Item label='Description' field='description'>
            <Input.TextArea placeholder='Optional description' allowClear maxLength={500} showWordLimit />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;

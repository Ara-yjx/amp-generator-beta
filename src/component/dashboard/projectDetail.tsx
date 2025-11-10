import React, { useEffect, useMemo, useState } from 'react';
import { Experiment, ExperimentFile, Project } from '../../data/apiTypes';
import { createExperiment, deleteExperiment, getExperimentsByProjectId, getExperimentFiles, updateProject, updateExperimentDescription } from '../../data/backend';
import { Button, Form, Input, Message, Modal, Popconfirm, Space, Table, Typography } from '@arco-design/web-react';
import { IconPlus, IconRefresh, IconDelete, IconEdit, IconCheck, IconClose } from '@arco-design/web-react/icon';
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

export const ProjectDetail: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
}> = ({ project, onUpdateProject }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editingExpId, setEditingExpId] = useState<number | null>(null);
  const [editExpDescription, setEditExpDescription] = useState('');
  const [updatingExpId, setUpdatingExpId] = useState<number | null>(null);
  const [hoveredExpId, setHoveredExpId] = useState<number | null>(null);

  const columns = useMemo(() => ([
    // { title: 'ID', dataIndex: 'id', width: 100 },
    // { title: 'Name', dataIndex: 'name', width: 220 },
    {
      title: 'Build Experiment', dataIndex: 'id', width: 200,
      render: (v: number) => <ProjectEditButton expId={v} />
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (_: any, record: Experiment) => {
        const isEditing = editingExpId === record.id;
        const isHovered = hoveredExpId === record.id;

        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}
            onMouseEnter={() => setHoveredExpId(record.id)}
            onMouseLeave={() => setHoveredExpId(null)}
          >
            {isEditing ? (
              <Space style={{ width: '100%' }}>
                <Input.TextArea
                  value={editExpDescription}
                  onChange={setEditExpDescription}
                  placeholder='Experiment description'
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1 }}
                />
                <Button
                  size='mini'
                  type='primary'
                  icon={<IconCheck />}
                  onClick={() => handleSaveExpDescription(record.id)}
                  loading={updatingExpId === record.id}
                />
                <Button
                  size='mini'
                  icon={<IconClose />}
                  onClick={() => {
                    setEditingExpId(null);
                    setEditExpDescription('');
                  }}
                  disabled={updatingExpId === record.id}
                />
              </Space>
            ) : (
              <>
                <span style={{ flex: 1 }}>{record.description || '(No description)'}</span>
                {isHovered && (
                  <Button
                    size='mini'
                    icon={<IconEdit />}
                    onClick={() => {
                      setEditingExpId(record.id);
                      setEditExpDescription(record.description || '');
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      }
    },
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
  ]), [editingExpId, editExpDescription, updatingExpId, hoveredExpId, deletingId]);

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
      setEditing(false);
      setEditName(project.name);
      setEditDescription(project.description || '');
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

  const handleStartEdit = () => {
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditName(project.name);
    setEditDescription(project.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Message.error('Project name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      const { project: updatedProject } = await updateProject(project.id, { name: editName.trim(), description: editDescription.trim() });
      Message.success('Project updated');
      setEditing(false);
      onUpdateProject(updatedProject);
    } catch (e: any) {
      Message.error(e?.meta?.message || 'Failed to update project');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveExpDescription = async (experimentId: number) => {
    setUpdatingExpId(experimentId);
    try {
      const { experiment: updatedExp } = await updateExperimentDescription(experimentId, { description: editExpDescription.trim() });
      Message.success('Description updated');
      setExperiments(prev => prev.map(exp => exp.id === experimentId ? updatedExp : exp));
      setEditingExpId(null);
      setEditExpDescription('');
    } catch (e: any) {
      Message.error(e?.meta?.message || 'Failed to update description');
    } finally {
      setUpdatingExpId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align='center' style={{ justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <Title heading={2} style={{ margin: 0, marginBottom: 4 }}>Experiments</Title>
          {editing ? (
            <Space direction='vertical' style={{ width: '100%' }}>
              <Input
                value={editName}
                onChange={setEditName}
                placeholder='Project name'
                style={{ maxWidth: 400 }}
              />
              <Input.TextArea
                value={editDescription}
                onChange={setEditDescription}
                placeholder='Project description (optional)'
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ maxWidth: 400 }}
              />
              <Space>
                <Button
                  size='small'
                  type='primary'
                  icon={<IconCheck />}
                  onClick={handleSaveEdit}
                  loading={updating}
                >
                  Save
                </Button>
                <Button
                  size='small'
                  icon={<IconClose />}
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </Space>
            </Space>
          ) : (
            <div>
              <div>
                <Title heading={5} style={{ margin: 0 }}>{project.name}</Title>
                <Text type='secondary'>{project.description || '(No description)'}</Text><br />
                <Text type='secondary'>Project ID: {project.id}</Text>
              </div>
              <Button
                size='mini'
                icon={<IconEdit />}
                onClick={handleStartEdit}
                style={{ marginTop: 2 }}
              />
            </div>
          )}
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

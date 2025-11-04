import React, { useEffect, useMemo, useState } from 'react';
import { Team, TeamMember } from '../../data/apiTypes';
import { getTeamMembers, addTeamMember, removeTeamMember, updateTeam } from '../../data/backend';
import { Button, Form, Input, InputNumber, Message, Modal, Popconfirm, Space, Table, Typography } from '@arco-design/web-react';
import { IconPlus, IconRefresh, IconDelete, IconEdit, IconCheck, IconClose } from '@arco-design/web-react/icon';

const { Title, Text } = Typography;

export const TeamDetail: React.FC<{ 
  team: Team;
  onUpdateTeam: (team: Team) => void;
}> = ({ team, onUpdateTeam }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const columns = useMemo(() => ([
    // { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username', width: 150 },
    { title: 'Email', dataIndex: 'email', width: 250 },
    { title: 'Role', dataIndex: 'role', width: 120 },
    {
      title: 'Joined At',
      dataIndex: 'joinedAt',
      width: 180,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-')
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      width: 100,
      render: (_: any, record: TeamMember) => (
        <Space>
          {team.isOwner && (
            <Popconfirm
              style={{ width: 300 }}
              focusLock
              title='Remove this member?'
              content='This action cannot be undone.'
              onOk={() => handleRemove(record.id)}
            >
              <Button
                size='mini'
                status='danger'
                icon={<IconDelete />}
                loading={removingId === record.id}
              >
                Remove
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]), [team.isOwner, removingId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { members } = await getTeamMembers(team.id);
      setMembers(members ?? []);
    } catch (e) {
      Message.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (team?.id != null) {
      loadMembers();
      setEditing(false);
      setEditName(team.name);
      setEditDescription(team.description || '');
    }
  }, [team?.id]);

  const handleOpenAdd = () => {
    setAddOpen(true);
    addForm.resetFields();
  };

  const handleAddSubmit = async () => {
    try {
      await addForm.validate();
      const values = addForm.getFieldsValue() as { userId: number };
      setAdding(true);
      await addTeamMember(team.id, values.userId);
      Message.success('Member added');
      setAddOpen(false);
      await loadMembers();
    } catch (e: any) {
      if (e?.error) return;
      Message.error(e?.meta?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: number) => {
    setRemovingId(userId);
    try {
      await removeTeamMember(team.id, userId);
      Message.success('Member removed');
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (e: any) {
      Message.error(e?.meta?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  const handleStartEdit = () => {
    setEditName(team.name);
    setEditDescription(team.description || '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditName(team.name);
    setEditDescription(team.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Message.error('Team name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      const { team: updatedTeam } = await updateTeam(team.id, { name: editName.trim(), description: editDescription.trim() });
      Message.success('Team updated');
      setEditing(false);
      onUpdateTeam(updatedTeam);
    } catch (e: any) {
      Message.error(e?.meta?.message || 'Failed to update team');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align='center' style={{ justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <Title heading={5} style={{ margin: 0, marginBottom: 4 }}>Team Members</Title>
          {editing ? (
            <Space direction='vertical' style={{ width: '100%' }}>
              <Input
                value={editName}
                onChange={setEditName}
                placeholder='Team name'
                style={{ maxWidth: 400 }}
              />
              <Input.TextArea
                value={editDescription}
                onChange={setEditDescription}
                placeholder='Team description (optional)'
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
              {/* <Space align='start'> */}
                <div>
                  <Title heading={5} style={{ margin: 0 }}>{team.name}</Title>
                  <Text type='secondary'>{team.description || '(No description)'}</Text><br />
                  <Text type='secondary'>Team ID: {team.id}</Text>
                </div>
                {team.isOwner && (
                  <Button
                    size='mini'
                    icon={<IconEdit />}
                    onClick={handleStartEdit}
                    style={{ marginTop: 2 }}
                  />
                )}
              {/* </Space> */}
            </div>
          )}
        </div>
        <Space>
          {team.isOwner && (
            <Button icon={<IconPlus />} type='primary' onClick={handleOpenAdd}>
              Add Member
            </Button>
          )}
          <Button icon={<IconRefresh />} onClick={loadMembers} loading={loading} />
        </Space>
      </Space>

      <Table
        rowKey='id'
        columns={columns as any}
        data={members}
        loading={loading}
        pagination={{ pageSize: 10 }}
        border
      />

      <Modal
        title='Add Team Member'
        visible={addOpen}
        onOk={handleAddSubmit}
        confirmLoading={adding}
        onCancel={() => setAddOpen(false)}
        unmountOnExit
      >
        <Form form={addForm} layout='vertical'>
          <Form.Item
            label='User ID'
            field='userId'
            rules={[{ required: true, message: 'Please enter a user ID' }]}
          >
            <InputNumber placeholder='Enter user ID' style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamDetail;

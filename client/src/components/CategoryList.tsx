import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Popconfirm, Input, Switch, Modal } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CategoryWithAncestors } from '../types';
import { api } from '../api/categoryApi';

export default function CategoryList() {
  const [data, setData] = useState<CategoryWithAncestors[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 10;

  const [editModal, setEditModal] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async (p: number, q?: string) => {
    setLoading(true);
    try {
      const res = await api.getFlat(p, limit, q || undefined);
      setData(res.data);
      if (res.pagination) setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(page, search); }, [page]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(id);
      message.success(`"${name}" deleted`);
      fetchData(page, search);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleToggle = async (id: string, active: boolean, name: string) => {
    try {
      const r = active ? await api.activate(id) : await api.deactivate(id);
      message.success(`"${name}" ${active ? 'activated' : 'deactivated'} (${r.deactivatedCount} total)`);
      fetchData(page, search);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleRename = async () => {
    if (!editModal) return;
    setEditLoading(true);
    try {
      await api.update(editModal.id, editName);
      message.success('Category renamed');
      setEditModal(null);
      fetchData(page, search);
    } catch (e: any) {
      message.error(e.message);
    }
    setEditLoading(false);
  };

  const columns: ColumnsType<CategoryWithAncestors> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: 'Path', key: 'chain', width: 450,
      render: (_: any, r: CategoryWithAncestors) => {
        if (!r.ancestorChain || r.ancestorChain.length === 0) return <Tag>root</Tag>;
        return (
          <span>
            {r.ancestorChain.map((a, i) => (
              <span key={a._id}>
                {i > 0 && <span style={{ margin: '0 4px', color: '#bbb' }}>&gt;</span>}
                <Tag color={i === r.ancestorChain.length - 1 ? 'blue' : 'default'} style={{ margin: 0 }}>
                  {a.name}
                </Tag>
              </span>
            ))}
          </span>
        );
      },
    },
    { title: 'ID', dataIndex: '_id', key: '_id', width: 100, render: (v: string) => <code style={{ fontSize: 11 }}>{v.slice(-6)}</code> },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', width: 80, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'yes' : 'no'}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 140, render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions', width: 240,
      render: (_: any, r: CategoryWithAncestors) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditModal({ id: r._id, name: r.name }); setEditName(r.name); }}>
            Edit
          </Button>
          <Popconfirm title="Delete this and all children?" onConfirm={() => handleDelete(r._id, r.name)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
          <Switch
            size="small"
            checked={r.isActive}
            onChange={(c) => handleToggle(r._id, c, r.name)}
          />
          <span style={{ fontSize: 11, color: '#999' }}>{r.isActive ? 'on' : 'off'}</span>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(val) => { setPage(1); fetchData(1, val); }}
          style={{ width: 260 }}
        />
      </Space>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (p) => setPage(p),
          showTotal: (t) => `${t} total`,
        }}
        size="small"
      />
      <Modal
        title="Rename Category"
        open={!!editModal}
        onOk={handleRename}
        onCancel={() => setEditModal(null)}
        confirmLoading={editLoading}
      >
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="New name" />
      </Modal>
    </div>
  );
}

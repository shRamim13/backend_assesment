import { useEffect, useState, useMemo } from 'react';
import { Spin, Tree, Tag, Button, Space, message, Tooltip, Typography, Modal, Descriptions, Switch, Popconfirm, Select, Input } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CategoryTreeNode, CategoryWithAncestors } from '../types';
import { api } from '../api/categoryApi';
import { debounce } from '../utils/debounce';

export default function CategoryTreeView() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<{ value: string; label: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const [detail, setDetail] = useState<CategoryWithAncestors | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTree = async (id?: string) => {
    setLoading(true);
    setTree([]);
    try {
      const data = await api.getTree(id || undefined);
      setTree(data);
    } catch (e: any) {
      message.error(e.message || 'Failed to load tree');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTree(); }, []);

  // Create a memoized debounced search function so it does not reset on renders
  const debouncedApiSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          const res = await api.getFlat(1, 20, query);
          const items = (res.data || []).map((c: any) => ({
            value: c._id,
            label: `${c.name}${c.ancestorChain?.length ? ` (${c.ancestorChain.map((a: any) => a.name).join(' > ')})` : ''}`,
          }));
          setSearchResults(items);
        } catch {
          setSearchResults([]);
        }
      }, 400),
    []
  );

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debouncedApiSearch(query.trim());
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchTree(id);
  };

  const handleRename = async () => {
    if (!renameModal) return;
    setRenameLoading(true);
    try {
      await api.update(renameModal.id, renameValue);
      message.success('Category renamed');
      setRenameModal(null);
      fetchTree(selectedId);
    } catch (e: any) {
      message.error(e.message);
    }
    setRenameLoading(false);
  };

  const showDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.getById(id);
      setDetail(res);
    } catch (e: any) {
      message.error(e.message);
    }
    setDetailLoading(false);
  };

  const handleToggle = async (id: string, active: boolean, name: string) => {
    try {
      const r = active ? await api.activate(id) : await api.deactivate(id);
      message.success(`"${name}" ${active ? 'activated' : 'deactivated'} (${r.affectedCount} total)`);
      fetchTree(selectedId);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.delete(id);
      message.success(`"${name}" deleted`);
      fetchTree(selectedId);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const toAntdNodes = (nodes: CategoryTreeNode[]): any[] =>
    nodes.map((n) => ({
      title: (
        <span>
          <Typography.Text
            style={{ fontWeight: 500, cursor: 'pointer' }}
            onClick={() => showDetail(n._id)}
          >
            {n.name}
          </Typography.Text>
          <Tag color={n.isActive ? 'green' : 'red'} style={{ marginLeft: 8, fontSize: 10 }}>
            {n.isActive ? 'active' : 'inactive'}
          </Tag>
          <Tooltip title={n._id}>
            <code style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>
              {n._id.slice(-6)}
            </code>
          </Tooltip>
          <EditOutlined
            style={{ marginLeft: 6, color: '#999', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setRenameModal({ id: n._id, name: n.name }); setRenameValue(n.name); }}
          />
          <Popconfirm title="Delete this and all children?" onConfirm={() => handleDelete(n._id, n.name)}>
            <DeleteOutlined style={{ marginLeft: 6, color: '#999', cursor: 'pointer' }} />
          </Popconfirm>
        </span>
      ),
      key: n._id,
      children: n.children.length > 0 ? toAntdNodes(n.children) : undefined,
    }));

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          showSearch
          placeholder="Search category by name"
          value={selectedId}
          onSearch={handleSearch}
          onSelect={handleSelect}
          onClear={() => { setSelectedId(undefined); setSearchResults([]); fetchTree(); }}
          allowClear
          filterOption={false}
          notFoundContent={null}
          style={{ width: 400 }}
          options={searchResults}
        />
        <Button onClick={() => { setSelectedId(undefined); setSearchResults([]); fetchTree(); }}>Full Tree</Button>
      </Space>
      {loading ? (
        <Spin size="large" style={{ display: 'block', marginTop: 40 }} />
      ) : tree.length === 0 ? (
        <p style={{ color: '#999' }}>No categories yet.</p>
      ) : (
        <Tree
          showLine
          defaultExpandAll
          treeData={toAntdNodes(tree)}
          style={{ background: 'transparent' }}
        />
      )}
      <Modal
        title="Rename Category"
        open={!!renameModal}
        onOk={handleRename}
        onCancel={() => setRenameModal(null)}
        confirmLoading={renameLoading}
      >
        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="New name" />
      </Modal>
      <Modal
        title={detail?.name || 'Category'}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        loading={detailLoading}
        width={600}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detail._id}</Descriptions.Item>
            <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Space>
                <Tag color={detail.isActive ? 'green' : 'red'}>{detail.isActive ? 'Active' : 'Inactive'}</Tag>
                <Switch size="small" checked={detail.isActive} onChange={(c) => {
                  setDetail(null);
                  handleToggle(detail._id, c, detail.name);
                }} />
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Parent">
              {detail.parentCategory ? (
                <span>
                  <Tag color="blue">{detail.parentCategory.name}</Tag>
                  <code style={{ fontSize: 11, marginLeft: 6 }}>{detail.parentCategory._id}</code>
                </span>
              ) : <Tag>root</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Ancestor Chain">
              {detail.ancestorChain && detail.ancestorChain.length > 0
                ? detail.ancestorChain.map((a) => a.name).join(' > ')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">{new Date(detail.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Updated">{new Date(detail.updatedAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

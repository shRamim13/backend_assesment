import { useEffect, useState } from 'react';
import { Spin, Tree, Tag, Button, Input, Space, message, Tooltip, Typography, Modal } from 'antd';
import type { CategoryTreeNode } from '../types';
import { api } from '../api/categoryApi';

export default function CategoryTreeView() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterId, setFilterId] = useState('');

  const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

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

  const handleRename = async () => {
    if (!renameModal) return;
    setRenameLoading(true);
    try {
      await api.update(renameModal.id, renameValue);
      message.success('Category renamed');
      setRenameModal(null);
      fetchTree(filterId || undefined);
    } catch (e: any) {
      message.error(e.message);
    }
    setRenameLoading(false);
  };

  const toAntdNodes = (nodes: CategoryTreeNode[]): any[] =>
    nodes.map((n) => ({
      title: (
        <span>
          <Typography.Text
            copyable={{ text: n._id, tooltips: ['Copy ID', 'Copied!'] }}
            style={{ fontWeight: 500, cursor: 'pointer' }}
            onClick={() => {
              setRenameModal({ id: n._id, name: n.name });
              setRenameValue(n.name);
            }}
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
        </span>
      ),
      key: n._id,
      children: n.children.length > 0 ? toAntdNodes(n.children) : undefined,
    }));

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Paste full 24-char category ID"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value.trim())}
          style={{ width: 320 }}
        />
        <Button type="primary" onClick={() => fetchTree(filterId)}>Load Subtree</Button>
        <Button onClick={() => { setFilterId(''); fetchTree(); }}>Full Tree</Button>
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
    </div>
  );
}

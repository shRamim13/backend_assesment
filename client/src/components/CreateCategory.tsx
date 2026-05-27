import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { api } from '../api/categoryApi';

interface Props {
  onSuccess: () => void;
}

export default function CreateCategory({ onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      const res = await api.create(values);
      if (!res.success) { message.error(res.message); return; }
      message.success(`"${res.data.name}" created`);
      form.resetFields();
      onSuccess();
    } catch (e: any) {
      message.error(e.message);
    }
    setLoading(false);
  };

  return (
    <Card title="Create Category" style={{ maxWidth: 500 }}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Use the full 24-character ID (copy from the tree) as Parent ID.
      </Typography.Text>
      <Form form={form} layout="vertical" onFinish={handleCreate}>
        <Form.Item name="name" label="Name" rules={[{ required: true, min: 2, max: 100 }]}>
          <Input placeholder="Category name" />
        </Form.Item>
        <Form.Item name="parentId" label="Parent ID (optional — full 24-char ID)">
          <Input placeholder="Leave empty for root category" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Create
        </Button>
      </Form>
    </Card>
  );
}

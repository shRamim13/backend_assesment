import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import type { BulkCreateDto } from '../types';
import { api } from '../api/categoryApi';

interface Props {
  onSuccess: () => void;
}

export default function BulkCreate({ onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      let body: BulkCreateDto;
      try {
        body = JSON.parse(values.body);
      } catch {
        message.error('Invalid JSON');
        setLoading(false);
        return;
      }
      const res = await api.createBulk(body);
      if (res.success) {
        const names = Array.isArray(res.data) ? res.data.map((c: any) => c.name).join(', ') : res.data.name;
        message.success(`Created: ${names}`);
        onSuccess();
      } else {
        message.error(res.message);
      }
    } catch (e: any) {
      message.error(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Typography.Paragraph type="secondary">
        Paste a nested JSON object. The API will recursively create all categories.
      </Typography.Paragraph>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="body" label="JSON Body" initialValue={JSON.stringify([
            { name: 'Clothing', parentId: '', children: [{ name: 'Men', children: [{ name: 'Shirt' }, { name: 'Pant' }] }] },
            { name: 'Gaming', parentId: '', children: [{ name: 'PC', children: [{ name: 'Action' }] }] },
          ], null, 2)}>
            <Input.TextArea rows={16} style={{ fontFamily: 'monospace', fontSize: 13 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Bulk
          </Button>
        </Form>
      </Card>
    </div>
  );
}

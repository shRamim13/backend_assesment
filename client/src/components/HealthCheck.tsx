import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Spin } from 'antd';
import type { HealthStatus } from '../types';
import { api } from '../api/categoryApi';

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    api.health().then(setHealth);
  }, []);

  if (!health) return <Spin style={{ display: 'block', marginTop: 40 }} />;

  return (
    <Card style={{ maxWidth: 500 }}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Status">
          <Tag color={health.status === 'ok' ? 'green' : 'red'}>{health.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Environment">{health.environment}</Descriptions.Item>
        <Descriptions.Item label="Uptime">{health.uptime}</Descriptions.Item>
        <Descriptions.Item label="MongoDB">
          <Tag color={health.services.mongodb === 'connected' ? 'green' : 'red'}>{health.services.mongodb}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Redis">
          <Tag color={health.services.redis === 'connected' ? 'green' : 'red'}>{health.services.redis}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

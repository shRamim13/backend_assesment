import { useState } from 'react';
import { ConfigProvider, Layout, Menu, Typography } from 'antd';
import { ApartmentOutlined, UnorderedListOutlined, PlusOutlined, ClusterOutlined, HeartOutlined } from '@ant-design/icons';
import CategoryTree from './components/CategoryTree';
import CategoryList from './components/CategoryList';
import CreateCategory from './components/CreateCategory';
import BulkCreate from './components/BulkCreate';
import HealthCheck from './components/HealthCheck';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: 'tree', icon: <ApartmentOutlined />, label: 'Category Tree' },
  { key: 'list', icon: <UnorderedListOutlined />, label: 'Flat List' },
  { key: 'create', icon: <PlusOutlined />, label: 'Create Category' },
  { key: 'bulk', icon: <ClusterOutlined />, label: 'Bulk Create' },
  { key: 'health', icon: <HeartOutlined />, label: 'Health' },
];

export default function App() {
  const [tab, setTab] = useState('tree');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const renderContent = () => {
    switch (tab) {
      case 'tree': return <CategoryTree key={refreshKey} />;
      case 'list': return <CategoryList key={refreshKey} />;
      case 'create': return <CreateCategory onSuccess={refresh} />;
      case 'bulk': return <BulkCreate onSuccess={refresh} />;
      case 'health': return <HealthCheck />;
      default: return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#1677ff', borderRadius: 6 },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <Title level={5} style={{ margin: 0 }}>Category Admin</Title>
          </div>
          <Menu mode="inline" selectedKeys={[tab]} items={menuItems} onClick={({ key }) => setTab(key)} style={{ borderRight: 0 }} />
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>{menuItems.find((m) => m.key === tab)?.label}</Title>
          </Header>
          <Content style={{ padding: 24, overflow: 'auto' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

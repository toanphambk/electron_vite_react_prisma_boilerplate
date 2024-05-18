import React, {useState} from 'react';
import {
  DesktopOutlined,
  FileSearchOutlined,
  PieChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {Breadcrumb, Layout, Menu} from 'antd';
import {Link, Routes, Route, HashRouter} from 'react-router-dom';
import ImportProgressMessage from './components/ImportProgress';
import PointRateCard from './components/PointRateCard';
import Sider from 'antd/es/layout/Sider';
import {Content} from 'antd/es/layout/layout';
import DailyRecordCard from './components/DailyRecordCard';
import RecordCard from './components/RecordCard';
import Notification from './components/Notification';
import SettingCard from './components/SettingCard';

type MenuItem = {
  key: string;
  icon: JSX.Element;
  label: string;
  element: JSX.Element;
  to: string;
};
const menuItems: MenuItem[] = [
  {
    key: 'Daily Record',
    icon: <DesktopOutlined />,
    label: 'Record Data',
    element: <DailyRecordCard />,
    to: '/',
  },
  {
    key: 'Record History',
    icon: <FileSearchOutlined />,
    label: 'Record History',
    element: <RecordCard />,
    to: '/Record History',
  },
  {
    key: 'Point Rate',
    icon: <PieChartOutlined />,
    label: 'Point Rate',
    element: <PointRateCard />,
    to: '/rate',
  },
  {
    key: 'Setting',
    icon: <SettingOutlined />,
    label: 'Setting Rate',
    element: <SettingCard />,
    to: '/setting',
  },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<string>(menuItems[0].key);

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
  };

  return (
    <HashRouter>
      <Layout style={{minHeight: '100vh'}}>
        <ImportProgressMessage />
        <Notification />
        <Sider
          theme="dark"
          collapsible
          collapsed={collapsed}
          onCollapse={value => setCollapsed(value)}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
        >
          <Menu
            theme="dark"
            defaultSelectedKeys={[menuItems[0].key]}
            selectedKeys={[selectedMenu]}
            mode="inline"
            onClick={e => handleMenuClick(e.key)}
          >
            {menuItems.map(item => (
              <Menu.Item
                key={item.key}
                icon={item.icon}
              >
                <Link to={item.to}>{item.label}</Link>
              </Menu.Item>
            ))}
          </Menu>
        </Sider>
        <Layout>
          <Content
            style={{margin: '0 16px'}}
            className="overflow-auto"
          >
            <Breadcrumb className="my-5">
              <Breadcrumb.Item>App</Breadcrumb.Item>
              <Breadcrumb.Item>
                {menuItems.find(item => item.key === selectedMenu)?.label}
              </Breadcrumb.Item>
            </Breadcrumb>
            <div className="flex flex-col items-center justify-center rounded-lg shadow-lg">
              <Routes>
                {menuItems.map(item => (
                  <Route
                    key={item.key}
                    path={item.to}
                    element={item.element}
                  />
                ))}
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </HashRouter>
  );
};

export default App;

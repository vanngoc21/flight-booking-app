import { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() =>
    window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const syncSidebar = () => setCollapsed(mobileQuery.matches);

    mobileQuery.addEventListener('change', syncSidebar);
    return () => mobileQuery.removeEventListener('change', syncSidebar);
  }, []);

  return (
    <Layout className="admin-shell min-h-screen">
      <Sidebar collapsed={collapsed} />

      <Layout>
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />

        <Content className="admin-content p-4 md:p-6">
          <div className="admin-page min-h-[calc(100vh-112px)]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
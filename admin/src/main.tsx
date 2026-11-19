import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#123b5d',
            colorInfo: '#2878b9',
            colorLink: '#2878b9',
            colorText: '#18384f',
            colorTextSecondary: '#687f91',
            colorBorder: '#e1eaf1',
            colorBgLayout: '#f7f9fc',
            colorWarning: '#c18b35',
            borderRadius: 12,
            borderRadiusLG: 18,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            controlHeight: 40,
          },
          components: {
            Layout: {
              bodyBg: 'transparent',
              headerBg: '#ffffff',
              siderBg: '#123b5d',
            },
            Menu: {
              darkItemBg: 'transparent',
              darkSubMenuItemBg: 'rgba(0, 0, 0, 0.12)',
              darkItemSelectedBg: 'rgba(232, 194, 122, 0.2)',
              darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
            },
            Table: {
              headerBg: '#f5f8fb',
              headerColor: '#60798b',
              borderColor: '#e1eaf1',
            },
          },
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

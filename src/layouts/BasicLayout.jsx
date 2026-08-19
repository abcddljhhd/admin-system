import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  BarChartOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { ShoppingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationBell from '../components/NotificationBell';


const { Header, Sider, Content } = Layout;

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/users', icon: <UserOutlined />, label: '会员管理' },
    { key: '/sales', icon: <BarChartOutlined />, label: '销售情况' },
    { key: '/products', icon: <ShoppingOutlined />, label: '商品管理' },
  ];


  const titles = {
  '/': '数据概览',
  '/users': '会员管理',
  '/sales': '销售情况',
  '/products': '商品管理',  // ← 加这行
};

  return (
    <Layout style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Sider 
        width={240} 
        style={{ 
          background: '#1e293b',
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ 
          height: 80, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}>
            <DashboardOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            Admin Pro
          </span>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          style={{ 
            background: 'transparent', 
            border: 'none',
            padding: '12px 16px',
          }}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          height: 72,
        }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
  {titles[location.pathname] || '后台管理'}
</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
           <NotificationBell />
                       <Dropdown menu={{ 
              items: [
                { 
                  key: 'password', 
                  icon: <LockOutlined />, 
                  label: '修改密码',
                  onClick: () => setPwdModalOpen(true)
                },
                { 
                  key: 'logout', 
                  icon: <LogoutOutlined />, 
                  label: '退出登录',
                  onClick: () => {
                    localStorage.removeItem('token');
                    navigate('/login');
                  }
                }
              ] 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  管
                </Avatar>
                <span style={{ fontWeight: 500, color: '#475569' }}>管理员</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 24, padding: 0 }}>
          <Outlet />
        </Content>

      <ChangePasswordModal open={pwdModalOpen} onClose={() => setPwdModalOpen(false)} />

      </Layout>
    </Layout>
  );
}
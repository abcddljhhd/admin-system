import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/login', values);
      localStorage.setItem('token', res.data.token);
      message.success('登录成功，欢迎回来');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{
        width: 400,
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: 'none',
        background: 'rgba(255,255,255,0.95)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>后台管理系统</h2>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>请输入账号密码登录</p>
        </div>

        <Form onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input 
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="用户名" 
              size="large"
              style={{ borderRadius: 12, height: 48 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="密码" 
              size="large"
              style={{ borderRadius: 12, height: 48 }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
              style={{
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              登 录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <a onClick={() => navigate('/forgot-password')} style={{ color: '#667eea', cursor: 'pointer', fontSize: 14 }}>
              忘记密码？
            </a>
          </div>

        </Form>
      </Card>
    </div>
  );
}
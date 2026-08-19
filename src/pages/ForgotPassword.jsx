import { useState } from 'react';
import { Card, Form, Input, Button, Steps, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, QuestionOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [username, setUsername] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const getQuestion = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/forgot-password/question', { username });
      setQuestion(res.data.question);
      setCurrent(1);
    } catch (err) {
      message.error(err.response?.data?.error || '获取问题失败');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/forgot-password/reset', {
        username,
        answer: values.answer
      });
      message.success(res.data.message);
      setCurrent(2);
      // 3秒后自动跳回登录
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      message.error(err.response?.data?.error || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '输入账号',
      content: (
        <Form onFinish={getQuestion}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
              style={{ borderRadius: 12, height: 48 }}
              onChange={e => setUsername(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}
            style={{ height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', fontWeight: 600 }}>
            下一步
          </Button>
        </Form>
      )
    },
    {
      title: '验证问题',
      content: (
        <Form onFinish={resetPassword}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>安全问题</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 16 }}>{question}</div>
          </div>
          <Form.Item name="answer" rules={[{ required: true, message: '请输入答案' }]}>
            <Input prefix={<QuestionOutlined />} placeholder="请输入答案" size="large" style={{ borderRadius: 12, height: 48 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}
            style={{ height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', fontWeight: 600 }}>
            确认重置
          </Button>
        </Form>
      )
    },
    {
      title: '重置成功',
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#10b981', marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>密码重置成功</h3>
          <p style={{ color: '#64748b', marginBottom: 8 }}>您的密码已重置为初始密码：</p>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#667eea', fontFamily: 'monospace', marginBottom: 16 }}>123456</div>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>3秒后自动返回登录页...</p>
          <Button type="primary" onClick={() => navigate('/login')} style={{ borderRadius: 10, marginTop: 8 }}>
            立即返回登录
          </Button>
        </div>
      )
    }
  ];

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{
        width: 420,
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: 'none',
        background: 'rgba(255,255,255,0.95)',
      }}>
        {current < 2 && (
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => current === 0 ? navigate('/login') : setCurrent(0)} style={{ padding: 0, marginBottom: 16, color: '#667eea' }}>
            {current === 0 ? '返回登录' : '上一步'}
          </Button>
        )}
        <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>忘记密码</h2>
        <Steps current={current} size="small" style={{ marginBottom: 32 }}>
          {steps.map(item => <Steps.Step key={item.title} title={item.title} />)}
        </Steps>
        {steps[current].content}
      </Card>
    </div>
  );
}
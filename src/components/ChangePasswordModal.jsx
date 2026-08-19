import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

export default function ChangePasswordModal({ open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await axios.post('/api/change-password', values);
      message.success('密码修改成功，请重新登录');
      form.resetFields();
      onClose();
      // 退出登录
      localStorage.removeItem('token');
      setTimeout(() => window.location.href = '/login', 1000);
    } catch (err) {
      message.error(err.response?.data?.error || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>修改密码</span>}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okButtonProps={{ style: { borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' } }}
      cancelButtonProps={{ style: { borderRadius: 10 } }}
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
          <Input.Password size="large" style={{ borderRadius: 10 }} placeholder="当前密码" />
        </Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
          <Input.Password size="large" style={{ borderRadius: 10 }} placeholder="新密码" />
        </Form.Item>
        <Form.Item name="securityQuestion" label="安全问题" rules={[{ required: true, message: '请设置安全问题' }]}>
          <Input size="large" style={{ borderRadius: 10 }} placeholder="如：你的生日是？" />
        </Form.Item>
        <Form.Item name="securityAnswer" label="问题答案" rules={[{ required: true, message: '请输入答案' }]}>
          <Input size="large" style={{ borderRadius: 10 }} placeholder="答案（用于忘记密码时验证）" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
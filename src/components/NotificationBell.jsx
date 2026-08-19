import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Empty, Button, Tag } from 'antd';
import { BellOutlined, WarningOutlined, ShoppingOutlined, EditOutlined } from '@ant-design/icons';
import { useWebSocket } from '../hooks/useWebSocket';
import axios from 'axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // 初始加载
  useEffect(() => {
    fetchNotifications();
  }, []);

  // WebSocket 实时接收
  useWebSocket((data) => {
    if (data.type === 'notification') {
      setNotifications(prev => [data.data, ...prev]);
      setUnreadCount(c => c + 1);
    }
  });

  async function fetchNotifications() {
    try {
      const [listRes, countRes] = await Promise.all([
        axios.get('/api/notifications'),
        axios.get('/api/notifications/unread-count')
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count);
    } catch (e) {
      console.log('获取通知失败', e);
    }
  }

  async function markAsRead(id) {
    await axios.post('/api/notifications/read', { id });
    fetchNotifications();
  }

  async function markAllRead() {
    await axios.post('/api/notifications/read', { id: 'all' });
    fetchNotifications();
  }

  // 根据类型显示不同图标
  const getIcon = (type) => {
    switch(type) {
      case 'stock_warning': return <WarningOutlined style={{ color: '#ef4444' }} />;
      case 'new_sale': return <ShoppingOutlined style={{ color: '#52c41a' }} />;
      case 'operation_log': return <EditOutlined style={{ color: '#667eea' }} />;
      default: return <BellOutlined style={{ color: '#999' }} />;
    }
  };

  const dropdownContent = (
    <div style={{ 
      width: 360, 
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600 }}>通知 ({unreadCount})</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>
            全部已读
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" style={{ padding: 20 }} />
      ) : (
        <List
          style={{ maxHeight: 400, overflow: 'auto' }}
          dataSource={notifications}
          renderItem={item => (
            <List.Item
              onClick={() => !item.isRead && markAsRead(item.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: item.isRead ? '#fff' : '#f6ffed',
                borderLeft: item.isRead ? 'none' : '3px solid #52c41a',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <div style={{ marginTop: 2 }}>{getIcon(item.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: item.isRead ? 400 : 600, 
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {item.title}
                    {item.type === 'stock_warning' && (
                      <Tag color="red" size="small">预警</Tag>
                    )}
                    {item.type === 'operation_log' && (
                      <Tag color="blue" size="small">日志</Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>
                    {item.content}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      placement="bottomRight"
      arrow
    >
      <Badge count={unreadCount} size="small">
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#64748b' }} />
      </Badge>
    </Dropdown>
  );
}
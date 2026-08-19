import { useState, useEffect } from 'react';
import { Card, Table, Tag, Statistic, Row, Col, Button, Modal, Input, Descriptions } from 'antd';
import { EyeOutlined, ReloadOutlined, CrownOutlined } from '@ant-design/icons';
import axios from 'axios';

const levelColors = {
  '普通会员': 'default',
  '银卡会员': 'cyan',
  '金卡会员': 'gold',
  '钻石会员': 'purple',
};

export default function UserList() {
  const [members, setMembers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => { fetchMembers(); }, [keyword]);

  const fetchMembers = async () => {
    const res = await axios.get('/api/members', {
      params: keyword ? { keyword } : {}
    });
    setMembers(res.data);
  };

  const handleReset = () => setKeyword('');

  const handleViewDetail = async (record) => {
    setSelectedMember(record);
    const res = await axios.get(`/api/members/${record.id}/orders`);
    setOrders(res.data);
    setIsDetailOpen(true);
  };

  const totalBalance = members.reduce((sum, m) => sum + (m.balance || 0), 0);
  const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);

  const columns = [
    {
      title: '会员',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `hsl(${text.charCodeAt(0) % 360}, 70%, 85%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: `hsl(${text.charCodeAt(0) % 360}, 70%, 40%)`,
            fontSize: 16,
          }}>
            {text[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{text}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.phone}</div>
          </div>
        </div>
      )
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag 
          icon={<CrownOutlined />} 
          color={levelColors[level] || 'default'} 
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {level}
        </Tag>
      )
    },
    {
      title: '储值余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (v) => <span style={{ fontWeight: 700, color: '#667eea' }}>¥{v?.toLocaleString()}</span>
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (v) => <span style={{ fontWeight: 700, color: '#f5576c' }}>{v?.toLocaleString()}</span>
    },
    {
      title: '生日',
      dataIndex: 'birthday',
      key: 'birthday',
      render: (d) => <span style={{ color: '#64748b' }}>{d}</span>
    },
    {
      title: '入会日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (d) => <span style={{ color: '#64748b' }}>{d}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{ borderRadius: 6 }}
        >
          详细
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
        <div 
    style={{ 
      width: '100%', 
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'default'
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.transform = 'scale(1.04)'; 
      e.currentTarget.style.filter = 'brightness(1.02)'; 
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.transform = 'scale(1)'; 
      e.currentTarget.style.filter = 'brightness(1)'; 
    }}
  >
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="会员总数"
              value={members.length}
              valueStyle={{ color: '#1b1d1c', fontWeight: 700, fontSize: 28 }}
            />
          </Card>
          </div>
        </Col>
        <Col span={8}>
        <div 
    style={{ 
      width: '100%', 
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'default'
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.transform = 'scale(1.04)'; 
      e.currentTarget.style.filter = 'brightness(1.02)'; 
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.transform = 'scale(1)'; 
      e.currentTarget.style.filter = 'brightness(1)'; 
    }}
  >
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="总储值余额"
              value={totalBalance}
              prefix="¥"
              valueStyle={{ color: '#1b1d1c', fontWeight: 700, fontSize: 28 }}
            />
          </Card>
          </div>
        </Col>
        <Col span={8}>
        <div 
    style={{ 
      width: '100%', 
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'default'
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.transform = 'scale(1.04)'; 
      e.currentTarget.style.filter = 'brightness(1.02)'; 
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.transform = 'scale(1)'; 
      e.currentTarget.style.filter = 'brightness(1)'; 
    }}
  >
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="总积分"
              value={totalPoints}
              valueStyle={{ color: '#1b1d1c', fontWeight: 700, fontSize: 28 }}
            />
          </Card>
          </div>
        </Col>
      </Row>

      <Card style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>会员档案</h2>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Input
              placeholder="搜索姓名或电话"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              allowClear
              style={{ width: 240, borderRadius: 10 }}
            />
            <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 10 }}>重置</Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: total => `共 ${total} 位会员` }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {selectedMember?.name} 的会员档案
          </span>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)} style={{ borderRadius: 10 }}>
            关闭
          </Button>
        ]}
        width={720}
      >
        {selectedMember && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="会员姓名">{selectedMember.name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedMember.phone}</Descriptions.Item>
              <Descriptions.Item label="会员等级">
                <Tag color={levelColors[selectedMember.level] || 'default'} style={{ borderRadius: 6 }}>
                  {selectedMember.level}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生日">{selectedMember.birthday}</Descriptions.Item>
              <Descriptions.Item label="储值余额">
                <span style={{ color: '#667eea', fontWeight: 700 }}>¥{selectedMember.balance?.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="积分">
                <span style={{ color: '#f5576c', fontWeight: 700 }}>{selectedMember.points?.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="入会日期">{selectedMember.joinDate}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedMember.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
              购买记录（{orders.length} 笔）
            </h3>
            
            {orders.length > 0 ? (
              <Table
                columns={[
                  { title: '商品', dataIndex: 'product', key: 'product' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (a) => <span style={{ fontWeight: 600, color: '#1e293b' }}>¥{a?.toLocaleString()}</span>
                  },
                  { title: '下单时间', dataIndex: 'date', key: 'date' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (s) => {
                      const colors = { '已完成': 'green', '配送中': 'blue', '待发货': 'orange', '已取消': 'red' };
                      return <Tag color={colors[s] || 'default'} style={{ borderRadius: 6 }}>{s}</Tag>;
                    }
                  },
                  { title: '备注', dataIndex: 'remark', key: 'remark', render: (r) => r || '-' },
                ]}
                dataSource={orders}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ borderRadius: 12, overflow: 'hidden' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                暂无购买记录
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
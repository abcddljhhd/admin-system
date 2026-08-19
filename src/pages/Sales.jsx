import { useState, useEffect } from 'react';
import { Card, Table, Tag, Statistic, Row, Col, Button, Modal, Input, DatePicker, Descriptions } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function Sales() {
  const [data, setData] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [keyword, setKeyword] = useState('');

  // 输入框或日期一变，自动去后端拉数据
  useEffect(() => { fetchSales(); }, [dateRange, keyword]);

  const fetchSales = async () => {
    const params = {};
    if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].format('YYYY-MM-DD');
    if (dateRange && dateRange[1]) params.dateTo = dateRange[1].format('YYYY-MM-DD');
    if (keyword) params.keyword = keyword;
    
    const res = await axios.get('/api/sales', { params });
    setData(res.data);
  };

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const handleViewDetail = (record) => {
    setDetailRecord(record);
    setIsDetailOpen(true);
  };

  const handleReset = () => {
    setDateRange(null);
    setKeyword('');
  };

  const columns = [
    { 
      title: '商品名称', 
      dataIndex: 'product', 
      key: 'product',
      render: (text) => <span style={{ fontWeight: 600, color: '#1e293b' }}>{text}</span>
    },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount) => <span style={{ fontWeight: 700, color: '#667eea' }}>¥{amount.toLocaleString()}</span>
    },
    { title: '交易日期', dataIndex: 'date', key: 'date' },
    { 
      title: '交易对象', 
      dataIndex: 'buyer', 
      key: 'buyer',
      render: (buyer) => <span style={{ color: '#64748b' }}>{buyer}</span>
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = { '已完成': 'green', '配送中': 'blue', '待发货': 'orange', '已取消': 'red' };
        return <Tag color={colors[status] || 'default'} style={{ borderRadius: 6 }}>{status}</Tag>;
      }
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
              title="筛选范围内销售额" 
              value={totalAmount} 
              prefix="¥" 
              valueStyle={{ color: '#171718', fontWeight: 700, fontSize: 28 }}
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
              title="订单笔数" 
              value={data.length} 
              valueStyle={{ color: '#151515', fontWeight: 700, fontSize: 28 }}
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
              title="平均客单价" 
              value={data.length ? Math.round(totalAmount / data.length) : 0} 
              prefix="¥" 
              valueStyle={{ color: '#0f0f0f', fontWeight: 700, fontSize: 28 }}
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>销售记录</h2>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <RangePicker 
              value={dateRange}
              onChange={setDateRange}
              style={{ borderRadius: 10 }}
              placeholder={['开始日期', '结束日期']}
              allowClear
            />
            <Input 
              placeholder="搜索商品/客户/设备码" 
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              allowClear
              style={{ width: 220, borderRadius: 10 }}
            />
            <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 10 }}>重置</Button>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          pagination={{ pageSize: 10, showTotal: total => `共 ${total} 条` }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>订单详情</span>}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)} style={{ borderRadius: 10 }}>关闭</Button>
        ]}
        width={560}
      >
        {detailRecord && (
          <Descriptions column={1} bordered style={{ marginTop: 16 }} labelStyle={{ fontWeight: 600, width: 120 }}>
            <Descriptions.Item label="商品名称">{detailRecord.product}</Descriptions.Item>
            <Descriptions.Item label="型号">{detailRecord.model || '-'}</Descriptions.Item>
            <Descriptions.Item label="规格">{detailRecord.spec || '-'}</Descriptions.Item>
            <Descriptions.Item label="颜色">{detailRecord.color || '-'}</Descriptions.Item>
            <Descriptions.Item label="设备码">
              <Tag color="purple" style={{ fontFamily: 'monospace' }}>{detailRecord.device_code || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="交易金额">
              <span style={{ color: '#667eea', fontWeight: 700, fontSize: 16 }}>¥{detailRecord.amount?.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="交易日期">{detailRecord.date}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailRecord.status === '已完成' ? 'green' : detailRecord.status === '配送中' ? 'blue' : 'orange'}>
                {detailRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="交易对象">{detailRecord.buyer || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detailRecord.buyer_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{detailRecord.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
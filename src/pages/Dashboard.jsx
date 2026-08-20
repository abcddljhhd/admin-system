import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, List, Empty, Radio, Spin } from 'antd';
import { 
  UserOutlined, ShoppingOutlined, DollarOutlined, TagOutlined,
  ArrowUpOutlined, ArrowDownOutlined, FireOutlined, InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// API 地址：本地用代理，生产用环境变量
const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [chartMode, setChartMode] = useState('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 同时请求所有数据
    Promise.all([
      axios.get(`${API_URL}/api/dashboard/stats`).catch(() => ({ data: null })),
      axios.get(`${API_URL}/api/dashboard/trend`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/api/dashboard/top-products`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/api/products`).catch(() => ({ data: { products: [] } }))
    ]).then(([statsRes, trendRes, topRes, productsRes]) => {
      setStats(statsRes.data);
      setTrend(trendRes.data);
      setTopProducts(topRes.data);
      setProducts(productsRes.data.products || []);
      setLoading(false);
    });
  }, []);

  // 加载中
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 数据加载失败
  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
        <p style={{ marginTop: 16, color: '#999' }}>数据加载失败，请检查后端服务</p>
      </div>
    );
  }

  // 安全获取数值
  const safeValue = (val) => val !== undefined && val !== null ? val : 0;
  const safeString = (val) => val?.toLocaleString() || '0';

  const warningProducts = products.filter(p => p.status === '上架' && p.total_stock <= p.warning_stock);

  const statCards = [
    { 
      title: '商品总数', 
      value: safeValue(stats.totalProducts), 
      icon: <ShoppingOutlined style={{ color: '#64748b' }} />,
      change: null,
      sub: `上架中 ${safeValue(stats.onSaleProducts)} 个`
    },
    { 
      title: '本周订单', 
      value: safeValue(stats.weekOrders), 
      icon: <UserOutlined style={{ color: '#64748b' }} />,
      change: safeValue(stats.orderChange),
      isUp: stats.isOrderUp,
      sub: `上周 ${safeValue(stats.lastWeekOrders)} 单`
    },
    { 
      title: '本周收入', 
      value: `¥${safeString(stats.weekRevenue)}`, 
      icon: <DollarOutlined style={{ color: '#64748b' }} />,
      change: safeValue(stats.revenueChange),
      isUp: stats.isRevenueUp,
      sub: `上周 ¥${safeString(stats.lastWeekRevenue)}`
    },
    { 
      title: '平均客单价', 
      value: `¥${safeString(stats.avgOrderValue)}`, 
      icon: <TagOutlined style={{ color: '#64748b' }} />,
      change: safeValue(stats.avgChange),
      isUp: stats.isAvgUp,
      sub: `上周 ¥${safeString(stats.lastWeekAvg)}`
    },
  ];

  return (
    <div>
      {/* 第一行：核心指标 */}
      <Row gutter={[20, 20]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index} style={{ display: 'flex' }}>
            <div style={{ width: '100%' }}>
              <Card 
                bordered={false} 
                style={{ 
                  borderRadius: 16, 
                  border: '1px solid #f1f5f9',
                  background: '#fff',
                  width: '100%'
                }}
                bodyStyle={{ padding: '20px 24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.5px' }}>
                      {card.value}
                    </div>
                    
                    {card.change !== null && card.change !== undefined ? (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ 
                          fontSize: 13, fontWeight: 600,
                          color: card.isUp ? '#10b981' : '#ef4444',
                          display: 'flex', alignItems: 'center', gap: 2
                        }}>
                          {card.isUp ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
                          {Math.abs(card.change)}%
                        </span>
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>较上周</span>
                      </div>
                    ) : (
                      <div style={{ height: 21, marginTop: 8 }} />
                    )}
                    
                    {card.sub && <div style={{ marginTop: 4, fontSize: 12, color: '#cbd5e1' }}>{card.sub}</div>}
                  </div>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, 
                    background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}>
                    {card.icon}
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        ))}
      </Row>

      {/* 第二行：趋势图 + 畅销榜 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                  {chartMode === 'revenue' ? '销售趋势（近7天）' : '订单分布（近7天）'}
                </span>
                <Radio.Group 
                  value={chartMode}
                  onChange={e => setChartMode(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="revenue">收入</Radio.Button>
                  <Radio.Button value="orders">订单</Radio.Button>
                </Radio.Group>
              </div>
            }
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #f1f5f9', height: '100%' }}
            bodyStyle={{ padding: '20px 24px 24px' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              {chartMode === 'revenue' ? (
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `¥${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => [`¥${value?.toLocaleString() || 0}`, '收入']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              ) : (
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => [`${value || 0} 单`, '订单数']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}
                  />
                  <Bar dataKey="orders" fill="#667eea" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}><FireOutlined style={{ color: '#f5576c', marginRight: 8 }}/>畅销 TOP5</span>} 
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #f1f5f9', height: '100%' }}
            bodyStyle={{ padding: '12px 24px' }}
          >
            {topProducts.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" style={{ marginTop: 40 }} />
            ) : (
              <List
                dataSource={topProducts}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: '14px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: index < 3 ? '#1e293b' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 11, color: index < 3 ? '#fff' : '#94a3b8',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.count || 0} 单</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#667eea', fontSize: 14, flexShrink: 0 }}>
                        ¥{(item.total || 0).toLocaleString()}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
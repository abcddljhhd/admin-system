import { useState, useEffect, useRef } from 'react';
import { Card, Statistic, Row, Col, List, Tag, Progress, Empty, Radio } from 'antd';
import { 
  UserOutlined, ShoppingOutlined, DollarOutlined, TagOutlined,
  ArrowUpOutlined, ArrowDownOutlined, FireOutlined, InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';


export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [chartMode, setChartMode] = useState('revenue');
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const rafId = useRef(null);
  const [centerIndex, setCenterIndex] = useState(0);
  useEffect(() => {
    axios.get('/api/dashboard/stats').then(res => setStats(res.data));
    axios.get('/api/dashboard/trend').then(res => setTrend(res.data));
    axios.get('/api/dashboard/top-products').then(res => setTopProducts(res.data));
    axios.get('/api/products').then(res => setProducts(res.data.products || []));
  }, []);

  if (!stats) return null;

  const warningProducts = products.filter(p => p.status === '上架' && p.total_stock <= p.warning_stock);

    const statCards = [
    { 
      title: '商品总数', 
      value: stats.totalProducts, 
      icon: <ShoppingOutlined style={{ color: '#64748b' }} />,
      change: null,
      sub: `上架中 ${stats.onSaleProducts} 个`
    },
    { 
      title: '本周订单', 
      value: stats.weekOrders, 
      icon: <UserOutlined style={{ color: '#64748b' }} />,
      change: stats.orderChange,
      isUp: stats.isOrderUp,
      sub: `上周 ${stats.lastWeekOrders} 单`
    },
    { 
      title: '本周收入', 
      value: `¥${stats.weekRevenue.toLocaleString()}`, 
      icon: <DollarOutlined style={{ color: '#64748b' }} />,
      change: stats.revenueChange,
      isUp: stats.isRevenueUp,
      sub: `上周 ¥${stats.lastWeekRevenue.toLocaleString()}`
    },
    { 
      title: '平均客单价', 
      value: `¥${stats.avgOrderValue.toLocaleString()}`, 
      icon: <TagOutlined style={{ color: '#64748b' }} />,
      change: stats.avgChange,
      isUp: stats.isAvgUp,
      sub: `上周 ¥${stats.lastWeekAvg.toLocaleString()}`
    },
  ];

  return (
    <div>
     {/* 第一行：核心指标 */}
      <Row gutter={[20, 20]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index} style={{ display: 'flex' }}>
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
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 16, 
                border: card.alert ? '1px solid #fecaca' : '1px solid #f1f5f9',
                background: card.alert ? '#fef2f2' : '#fff',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>{card.title}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: card.alert ? '#ef4444' : '#1e293b', letterSpacing: '-0.5px' }}>
                      {card.value}
                    </div>
                    
                    {card.change !== null ? (
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
                    {card.alert && <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>需及时补货</div>}
                  </div>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, 
                    background: card.alert ? '#fee2e2' : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          </Col>
        ))}
      </Row>

      {/* 第二行：趋势/订单切换图 + 畅销 */}
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
                    formatter={(value) => [`¥${value.toLocaleString()}`, '收入']}
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
                    formatter={(value) => [`${value} 单`, '订单数']}
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
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.count} 单</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#667eea', fontSize: 14, flexShrink: 0 }}>
                        ¥{item.total?.toLocaleString()}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

          {/* 第三行：库存总览（惯性拖拽 + 中心放大 + 无限循环） */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card 
            title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>库存总览</span>} 
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #f1f5f9' }}
            bodyStyle={{ padding: '20px 0' }}
          >
            {products.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <InboxOutlined style={{ fontSize: 40, color: '#e2e8f0', marginBottom: 12 }} />
                <span style={{ color: '#94a3b8', fontSize: 14 }}>暂无商品数据</span>
              </div>
            ) : (
              <div
                ref={scrollRef}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  dragStartX.current = e.pageX;
                  dragScrollLeft.current = scrollRef.current.scrollLeft;
                  velocity.current = 0;
                  lastX.current = e.pageX;
                  if (rafId.current) cancelAnimationFrame(rafId.current);
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  e.preventDefault();
                  const dx = dragStartX.current - e.pageX;
                  scrollRef.current.scrollLeft = dragScrollLeft.current + dx;
                  velocity.current = e.pageX - lastX.current;
                  lastX.current = e.pageX;
                }}
                onMouseUp={() => {
                  if (!isDragging) return;
                  setIsDragging(false);
                  
                  // 惯性滑翔
                  const el = scrollRef.current;
                  let speed = velocity.current * 1.5;
                  const friction = 0.94;
                  
                  const glide = () => {
                    if (Math.abs(speed) < 0.3) {
                      // 惯性结束，检查无限循环边界
                      const half = el.scrollWidth / 2;
                      if (el.scrollLeft >= half) el.scrollLeft -= half;
                      else if (el.scrollLeft <= 0) el.scrollLeft += half;
                      return;
                    }
                    el.scrollLeft -= speed;
                    speed *= friction;
                    
                    // 滑翔过程中也检查边界
                    const half = el.scrollWidth / 2;
                    if (el.scrollLeft >= half) el.scrollLeft -= half;
                    else if (el.scrollLeft <= 0) el.scrollLeft += half;
                    
                    rafId.current = requestAnimationFrame(glide);
                  };
                  glide();
                }}
                onMouseLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                    const el = scrollRef.current;
                    const half = el.scrollWidth / 2;
                    if (el.scrollLeft >= half) el.scrollLeft -= half;
                    else if (el.scrollLeft <= 0) el.scrollLeft += half;
                  }
                }}
                onScroll={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  
                  // 找中心卡片
                  const cards = Array.from(el.children);
                  const center = el.scrollLeft + el.clientWidth / 2;
                  let closest = 0;
                  let minDist = Infinity;
                  cards.forEach((card, i) => {
                    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                    const dist = Math.abs(cardCenter - center);
                    if (dist < minDist) {
                      minDist = dist;
                      closest = i;
                    }
                  });
                  setCenterIndex(closest);
                }}
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  overflowX: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  padding: '0 24px',
                }}
              >
                {[...products, ...products].map((item, index) => {
                  const maxRef = (item.warning_stock || 10) * 2;
                  const current = item.total_stock || 0;
                  const percent = Math.min((current / maxRef) * 100, 100);
                  const isWarning = current <= (item.warning_stock || 0);
                  const barColor = isWarning ? '#ef4444' : percent < 50 ? '#f59e0b' : '#10b981';
                  const isCenter = index === centerIndex;
                  
                  return (
                    <div 
                      key={`${item.id}-${index}`} 
                      style={{ 
                        minWidth: 240, 
                        flexShrink: 0,
                        borderRadius: 12,
                        border: isWarning ? '1px solid #fecaca' : '1px solid #f1f5f9',
                        background: isWarning ? '#fef2f2' : '#fff',
                        padding: 16,
                        transform: isCenter ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s',
                        boxShadow: isCenter ? '0 8px 30px rgba(0,0,0,0.08)' : 'none',
                        zIndex: isCenter ? 2 : 1,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 8,
                          background: `hsl(${item.id * 60}, 70%, 85%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: `hsl(${item.id * 60}, 70%, 40%)`,
                          fontSize: 12,
                        }}>
                          {item.name?.substring(0, 3)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            color: '#1e293b', 
                            fontSize: 14, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            width: 160
                          }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.category}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>现存量</span>
                        <div>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: 20, 
                            color: isWarning ? '#ef4444' : '#1e293b',
                            marginRight: 4
                          }}>
                            {current}
                          </span>
                          <span style={{ fontSize: 12, color: '#cbd5e1' }}>/ 预警 {item.warning_stock || 0}</span>
                        </div>
                      </div>
                      
                      <Progress 
                        percent={percent} 
                        strokeColor={barColor}
                        trailColor="#f1f5f9"
                        showInfo={false}
                        size="small"
                        style={{ marginBottom: 4 }}
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#cbd5e1' }}>0</span>
                        <span style={{ color: barColor, fontWeight: 600 }}>
                          {isWarning ? '库存不足' : percent < 50 ? '库存偏低' : '库存充足'}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>{maxRef}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
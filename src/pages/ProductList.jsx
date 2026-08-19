import { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Statistic, Row, Col, Button, Modal, Form, Input, 
  Select, InputNumber, Switch, Checkbox, Space, Image, message, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, 
  ReloadOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

const CATEGORIES = ['手机', '电脑', '配件', '穿戴', '家居', '其他'];
const TAG_OPTIONS = ['新品', '热销', '特价', '推荐'];


export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [warnings, setWarnings] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isMultiSpec, setIsMultiSpec] = useState(false);
  const [onSaleModalOpen, setOnSaleModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
const [addStockNum, setAddStockNum] = useState(0);


  useEffect(() => { fetchProducts(); }, [keyword, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    
    const res = await axios.get('/api/products', { params });
    setProducts(res.data.products);
    setWarnings(res.data.warnings);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/products/${id}`);
    message.success('删除成功');
    fetchProducts();
  };

  const handleBatchStatus = async (status) => {
    if (selectedRows.length === 0) return message.warning('请先选择商品');
    await axios.post('/api/products/batch-status', { ids: selectedRows, status });
    message.success(`已批量${status}`);
    fetchProducts();
  };


const handleBatchStock = async () => {
  if (selectedRows.length === 0) return message.warning('请先选择商品');
  if (!addStockNum || addStockNum <= 0) return message.warning('请输入有效的进货数量');
  
  await axios.post('/api/products/batch-stock', { ids: selectedRows, addStock: parseInt(addStockNum) });
  message.success(`已为 ${selectedRows.length} 个商品入库 ${addStockNum} 件`);
  setStockModalOpen(false);
  setAddStockNum(0);
  setSelectedRows([]);
  fetchProducts();
};


  const handleEdit = async (record) => {
    setEditingId(record.id);
    const res = await axios.get(`/api/products/${record.id}`);
    const p = res.data;
    setIsMultiSpec(!!p.is_multi_spec);
    form.setFieldsValue({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
      detail_images: JSON.parse(p.detail_images || '[]').join('\n'),
      specs: p.specs || []
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsMultiSpec(false);
    form.resetFields();
    form.setFieldsValue({ 
      status: '上架', 
      warning_stock: 10, 
      total_stock: 0,
      tags: [],
      specs: []
    });
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      detail_images: values.detail_images ? values.detail_images.split('\n').filter(Boolean) : [],
      tags: values.tags || [],
      is_multi_spec: isMultiSpec,
      specs: isMultiSpec ? (values.specs || []) : []
    };
    
    if (editingId) {
      await axios.put(`/api/products/${editingId}`, payload);
      message.success('修改成功');
    } else {
      await axios.post('/api/products', payload);
      message.success('添加成功');
    }
    setIsModalOpen(false);
    fetchProducts();
  };

  const handleViewDetail = async (record) => {
    const res = await axios.get(`/api/products/${record.id}`);
    setDetailProduct(res.data);
    setIsDetailOpen(true);
  };

  const handleReset = () => {
    setKeyword('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  const onSaleProducts = products.filter(p => p.status === '上架');
  const warningProducts = products.filter(p => p.status === '上架' && p.total_stock <= p.warning_stock);
  const totalStock = products.reduce((sum, p) => sum + (p.total_stock || 0), 0);
  const onSaleCount = onSaleProducts.length;

  const columns = [
    {
      title: '商品',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image 
            src={record.cover_image || 'https://placehold.co/60x60'} 
            width={60} 
            height={60} 
            style={{ borderRadius: 8, objectFit: 'cover' }}
            preview={false}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{text}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.category}</div>
          </div>
        </div>
      )
    },
    {
      title: '价格',
      key: 'price',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#667eea' }}>¥{record.sale_price?.toLocaleString()}</div>
          {record.line_price > record.sale_price && (
            <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
              ¥{record.line_price?.toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
  title: '库存',
  key: 'stock',
  render: (_, record) => {
    const isLow = record.status === '上架' && record.total_stock <= record.warning_stock;
    return (
      <div>
        <span style={{ fontWeight: 600, color: isLow ? '#f5576c' : '#1e293b' }}>
          {record.total_stock}
        </span>
        {isLow && <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>预警</Tag>}
      </div>
    );
  }
},
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === '上架' ? 'green' : status === '定时上架' ? 'blue' : 'default'} style={{ borderRadius: 6 }}>
          {status}
        </Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => {
        const list = JSON.parse(tags || '[]');
        const colors = { '新品': 'cyan', '热销': 'red', '特价': 'orange', '推荐': 'purple' };
        return (
          <Space size={4}>
            {list.map(t => <Tag key={t} color={colors[t]} style={{ borderRadius: 4, fontSize: 11 }}>{t}</Tag>)}
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 6 }}>详细</Button>
          <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: 6 }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger ghost size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {warnings > 0 && (
        <div style={{ 
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, 
          padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 
        }}>
          <WarningOutlined style={{ color: '#ef4444', fontSize: 18 }} />
          <span style={{ color: '#991b1b', fontWeight: 600 }}>
            库存预警：有 {warnings} 个商品库存低于安全线，请及时补货
          </span>
        </div>
      )}

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div 
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <Statistic title="商品总数" value={products.length} valueStyle={{ color: '#1e293b', fontWeight: 700, fontSize: 24 }} />
            </Card>
          </div>
        </Col>
        <Col span={6}>
          <div 
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
            onClick={() => setOnSaleModalOpen(true)}
          >
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderColor: '#10b981' }}>
              <Statistic title="上架中" value={onSaleCount} valueStyle={{ color: '#5bb687', fontWeight: 700, fontSize: 24 }} prefix={<ArrowUpOutlined />} />
            </Card>
          </div>
        </Col>
        <Col span={6}>
          <div 
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
            onClick={() => setWarningModalOpen(true)}
          >
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderColor: warnings > 0 ? '#f5576c' : undefined }}>
              <Statistic title="库存预警" value={warnings} valueStyle={{ color: '#f5576c', fontWeight: 700, fontSize: 24 }} prefix={<WarningOutlined />} />
            </Card>
          </div>
        </Col>
        <Col span={6}>
          <div 
            style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <Statistic title="总库存" value={totalStock} valueStyle={{ color: '#1e293b', fontWeight: 700, fontSize: 24 }} />
            </Card>
          </div>
        </Col>
      </Row>

      <Card style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>商品管理</h2>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Input placeholder="搜索商品" value={keyword} onChange={e => setKeyword(e.target.value)} allowClear style={{ width: 180, borderRadius: 10 }} />
            <Select placeholder="分类" value={categoryFilter || undefined} onChange={setCategoryFilter} allowClear style={{ width: 120, borderRadius: 10 }} options={CATEGORIES.map(c => ({ label: c, value: c }))} />
            <Select placeholder="状态" value={statusFilter || undefined} onChange={setStatusFilter} allowClear style={{ width: 120, borderRadius: 10 }} options={[{label:'上架',value:'上架'},{label:'下架',value:'下架'},{label:'定时上架',value:'定时上架'}]} />
            <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 10 }}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', fontWeight: 600 }}>新增商品</Button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
  <Space>
    <Button size="small" onClick={() => handleBatchStatus('上架')} icon={<ArrowUpOutlined />}>批量上架</Button>
    <Button size="small" onClick={() => handleBatchStatus('下架')} icon={<ArrowDownOutlined />}>批量下架</Button>
    <Button size="small" type="primary" onClick={() => setStockModalOpen(true)} icon={<PlusOutlined />}>批量入库</Button>
  </Space>
</div>

        <Table 
          rowSelection={{ onChange: (keys) => setSelectedRows(keys) }}
          columns={columns} 
          dataSource={products} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>{editingId ? '编辑商品' : '新增商品'}</span>}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        okButtonProps={{ style: { borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' } }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
                <Input size="large" style={{ borderRadius: 10 }} placeholder="如：iPhone 15 Pro" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select size="large" style={{ borderRadius: 10 }} placeholder="选择分类" options={CATEGORIES.map(c => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cover_image" label="封面图URL">
                <Input size="large" style={{ borderRadius: 10 }} placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="video_url" label="视频URL">
                <Input size="large" style={{ borderRadius: 10 }} placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="商品简介">
            <TextArea rows={3} style={{ borderRadius: 10 }} placeholder="简短描述商品卖点..." />
          </Form.Item>

          <Form.Item name="detail_images" label="多图详情（每行一个URL）">
            <TextArea rows={3} style={{ borderRadius: 10 }} placeholder="https://image1.jpg&#10;https://image2.jpg" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="original_price" label="原价">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="9999" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sale_price" label="售卖价" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="8999" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="member_price" label="会员价">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="8599" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="line_price" label="划线价（展示用）">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="10999" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cost_price" label="成本价（算利润）">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="7000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="schedule_time" label="定时上架">
                <Input size="large" style={{ borderRadius: 10 }} placeholder="2024-02-01 10:00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="total_stock" label="总库存">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="warning_stock" label="库存预警阈值">
                <InputNumber size="large" style={{ width: '100%', borderRadius: 10 }} min={0} placeholder="10" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select size="large" style={{ borderRadius: 10 }} options={[{label:'上架',value:'上架'},{label:'下架',value:'下架'},{label:'定时上架',value:'定时上架'}]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tags" label="商品标签">
            <Checkbox.Group options={TAG_OPTIONS} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 12 }}>多规格模式：</span>
            <Switch checked={isMultiSpec} onChange={setIsMultiSpec} />
          </div>

          {isMultiSpec && (
            <Form.List name="specs">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={12} key={key} style={{ marginBottom: 8 }}>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'spec_name']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="规格名（如：颜色）" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'spec_value']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="规格值（如：红色）" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} name={[name, 'stock']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="库存" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="售价" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} name={[name, 'member_price']} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="会员价" style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button danger type="text" onClick={() => remove(name)}>删</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block style={{ borderRadius: 10 }}>+ 添加规格</Button>
                </div>
              )}
            </Form.List>
          )}
        </Form>
      </Modal>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>商品详情</span>}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[<Button key="close" onClick={() => setIsDetailOpen(false)} style={{ borderRadius: 10 }}>关闭</Button>]}
        width={720}
      >
        {detailProduct && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <Image src={detailProduct.cover_image} style={{ borderRadius: 12, width: '100%' }} />
              </Col>
              <Col span={16}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{detailProduct.name}</h3>
                <Space size={8} style={{ marginBottom: 12 }}>
                  <Tag color="blue">{detailProduct.category}</Tag>
                  <Tag color={detailProduct.status === '上架' ? 'green' : 'default'}>{detailProduct.status}</Tag>
                  {JSON.parse(detailProduct.tags || '[]').map(t => <Tag key={t} color="purple">{t}</Tag>)}
                </Space>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#667eea', marginBottom: 4 }}>
                  ¥{detailProduct.sale_price?.toLocaleString()}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>
                  原价 ¥{detailProduct.original_price?.toLocaleString()} · 会员价 ¥{detailProduct.member_price?.toLocaleString()}
                </div>
              </Col>
            </Row>
            
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>商品简介</div>
              <div style={{ color: '#64748b' }}>{detailProduct.description || '暂无简介'}</div>
            </div>

            {detailProduct.specs && detailProduct.specs.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>规格明细</div>
                <Table
                  columns={[
                    { title: '规格名', dataIndex: 'spec_name' },
                    { title: '规格值', dataIndex: 'spec_value' },
                    { title: '库存', dataIndex: 'stock' },
                    { title: '售价', dataIndex: 'price', render: v => `¥${v}` },
                    { title: '会员价', dataIndex: 'member_price', render: v => `¥${v}` },
                  ]}
                  dataSource={detailProduct.specs}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>上架中商品（{onSaleProducts.length} 个）</span>}
        open={onSaleModalOpen}
        onCancel={() => setOnSaleModalOpen(false)}
        footer={[<Button key="close" onClick={() => setOnSaleModalOpen(false)} style={{ borderRadius: 10 }}>关闭</Button>]}
        width={800}
      >
        <Table
          columns={[
            {
              title: '商品',
              render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={r.cover_image} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.category}</div>
                  </div>
                </div>
              )
            },
            { title: '售价', dataIndex: 'sale_price', render: v => <span style={{ color: '#667eea', fontWeight: 700 }}>¥{v?.toLocaleString()}</span> },
            { title: '库存', dataIndex: 'total_stock', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            {
              title: '标签',
              dataIndex: 'tags',
              render: tags => {
                const list = JSON.parse(tags || '[]');
                return <Space size={4}>{list.map(t => <Tag key={t} color="purple" style={{ borderRadius: 4, fontSize: 11 }}>{t}</Tag>)}</Space>;
              }
            },
          ]}
          dataSource={onSaleProducts}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="small"
          style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden' }}
        />
      </Modal>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700, color: '#f5576c' }}>库存预警商品（{warningProducts.length} 个）</span>}
        open={warningModalOpen}
        onCancel={() => setWarningModalOpen(false)}
        footer={[<Button key="close" onClick={() => setWarningModalOpen(false)} style={{ borderRadius: 10 }}>关闭</Button>]}
        width={800}
      >
        <Table
          columns={[
            {
              title: '商品',
              render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={r.cover_image} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.category}</div>
                  </div>
                </div>
              )
            },
            { title: '售价', dataIndex: 'sale_price', render: v => <span style={{ color: '#667eea', fontWeight: 700 }}>¥{v?.toLocaleString()}</span> },
            {
              title: '当前库存',
              dataIndex: 'total_stock',
              render: v => <span style={{ fontWeight: 700, color: '#f5576c' }}>{v}</span>
            },
            {
              title: '预警线',
              dataIndex: 'warning_stock',
              render: v => <Tag color="orange" style={{ borderRadius: 6 }}>{v}</Tag>
            },
          ]}
          dataSource={warningProducts}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          size="small"
          style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden' }}
        />
      </Modal>
      <Modal
  title={<span style={{ fontSize: 18, fontWeight: 700 }}>批量入库</span>}
  open={stockModalOpen}
  onOk={handleBatchStock}
  onCancel={() => { setStockModalOpen(false); setAddStockNum(0); }}
  okButtonProps={{ style: { borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' } }}
  cancelButtonProps={{ style: { borderRadius: 10 } }}
>
  <div style={{ marginTop: 16 }}>
    <p style={{ color: '#64748b', marginBottom: 16 }}>
      已选择 <strong style={{ color: '#667eea' }}>{selectedRows.length}</strong> 个商品，请输入本次进货数量：
    </p>
    <InputNumber
      value={addStockNum}
      onChange={setAddStockNum}
      min={1}
      size="large"
      style={{ width: '100%', borderRadius: 10 }}
      placeholder="输入进货数量，如：50"
      autoFocus
    />
  </div>
</Modal>
    </div>
  );
}
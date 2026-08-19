import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ========== WebSocket 设置 ==========
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket 客户端连接');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket 客户端断开');
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

const db = new sqlite3.Database(join(__dirname, 'data.db'));

// Promise 包装
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { 
    err ? reject(err) : resolve({ id: this.lastID, changes: this.changes }); 
  });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

// ========== 通知辅助函数 ==========
async function addNotification(type, title, content) {
  const result = await dbRun(
    "INSERT INTO notifications (type, title, content, isRead, createdAt) VALUES (?, ?, ?, 0, ?)",
    [type, title, content, new Date().toISOString()]
  );
  
  broadcast({
    type: 'notification',
    data: {
      id: result.id,
      type,
      title,
      content,
      isRead: 0,
      createdAt: new Date().toISOString()
    }
  });
  
  return result;
}

async function checkStockWarning(productId) {
  const product = await dbGet("SELECT * FROM products WHERE id = ?", [productId]);
  if (product && product.total_stock <= product.warning_stock && product.status === '上架') {
    const existing = await dbGet(
      "SELECT * FROM notifications WHERE type = ? AND content LIKE ? AND isRead = 0",
      ['stock_warning', `%${product.name}%`]
    );
    if (!existing) {
      await addNotification(
        'stock_warning',
        '库存预警',
        `${product.name} 库存不足 ${product.total_stock} 件，请及时补货`
      );
    }
  }
}

async function addOperationLog(action, detail, operator = 'admin') {
  await addNotification(
    'operation_log',
    '操作记录',
    `[${operator}] ${action}: ${detail}`
  );
}

// ========== 初始化数据库 ==========
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    security_question TEXT,
    security_answer TEXT
  )`);

  db.run("ALTER TABLE admins ADD COLUMN security_question TEXT", () => {});
  db.run("ALTER TABLE admins ADD COLUMN security_answer TEXT", () => {});

  db.get("SELECT COUNT(*) as count FROM admins", (err, row) => {
    if (row.count === 0) {
      bcrypt.hash('123456', 10).then(hashed => {
        db.run("INSERT INTO admins (username, password, security_question, security_answer) VALUES (?, ?, ?, ?)", 
          ['admin', hashed, '你的生日是？', '19900101']);
      });
    } else {
      db.get("SELECT * FROM admins WHERE username = 'admin'", (e, admin) => {
        if (admin && (!admin.security_question || !admin.security_answer)) {
          db.run("UPDATE admins SET security_question = ?, security_answer = ? WHERE username = ?", 
            ['你的生日是？', '19900101', 'admin']);
        }
      });
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT,
    amount INTEGER,
    date TEXT,
    status TEXT,
    model TEXT,
    spec TEXT,
    color TEXT,
    device_code TEXT,
    buyer TEXT,
    buyer_phone TEXT,
    remark TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    level TEXT,
    balance INTEGER,
    points INTEGER,
    birthday TEXT,
    joinDate TEXT,
    remark TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    cover_image TEXT,
    description TEXT,
    detail_images TEXT,
    video_url TEXT,
    status TEXT DEFAULT '下架',
    tags TEXT,
    original_price INTEGER,
    sale_price INTEGER,
    member_price INTEGER,
    line_price INTEGER,
    cost_price INTEGER,
    total_stock INTEGER DEFAULT 0,
    warning_stock INTEGER DEFAULT 10,
    is_multi_spec INTEGER DEFAULT 0,
    schedule_time TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS product_specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    spec_name TEXT,
    spec_value TEXT,
    stock INTEGER,
    price INTEGER,
    member_price INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    content TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT
  )`);

  // 生成模拟商品数据
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (row.count === 0) {
      const categories = ['手机', '电脑', '配件', '穿戴'];
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`INSERT INTO products 
        (name, category, cover_image, description, detail_images, video_url, status, tags,
         original_price, sale_price, member_price, line_price, cost_price, total_stock, warning_stock, is_multi_spec, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      const products = [
        ['iPhone 15 Pro', '手机', 'https://placehold.co/100x100/667eea/ffffff?text=iPhone', '苹果最新旗舰手机', '["https://placehold.co/300x200"]', '', '上架', '["新品","热销"]', 9999, 8999, 8599, 10999, 7000, 120, 20, 1, now],
        ['MacBook Air M3', '电脑', 'https://placehold.co/100x100/764ba2/ffffff?text=Mac', '轻薄高性能笔记本', '["https://placehold.co/300x200"]', '', '上架', '["推荐"]', 10999, 9999, 9599, 11999, 8000, 45, 10, 1, now],
        ['AirPods Pro 2', '配件', 'https://placehold.co/100x100/f5576c/ffffff?text=Pods', '主动降噪耳机', '["https://placehold.co/300x200"]', '', '上架', '["特价"]', 1999, 1699, 1599, 2199, 1200, 8, 10, 0, now],
        ['Apple Watch S9', '穿戴', 'https://placehold.co/100x100/10b981/ffffff?text=Watch', '智能健康手表', '["https://placehold.co/300x200"]', '', '上架', '["新品"]', 2999, 2799, 2699, 3299, 2000, 200, 30, 1, now],
        ['iPad Air 5', '电脑', 'https://placehold.co/100x100/f093fb/ffffff?text=iPad', '全面屏平板电脑', '["https://placehold.co/300x200"]', '', '上架', '["热销"]', 4799, 4299, 4099, 5299, 3500, 3, 5, 0, now],
      ];
      
      products.forEach(p => stmt.run(p));
      stmt.finalize();
      
      setTimeout(() => {
        db.get("SELECT id FROM products WHERE name = 'iPhone 15 Pro'", (e, r) => {
          if (r) {
            const s = db.prepare("INSERT INTO product_specs (product_id, spec_name, spec_value, stock, price, member_price) VALUES (?, ?, ?, ?, ?, ?)");
            s.run(r.id, '颜色', '原色钛金属', 40, 8999, 8599);
            s.run(r.id, '颜色', '白色钛金属', 35, 8999, 8599);
            s.run(r.id, '颜色', '蓝色钛金属', 25, 8999, 8599);
            s.run(r.id, '存储', '256GB', 60, 8999, 8599);
            s.run(r.id, '存储', '512GB', 40, 9999, 9599);
            s.finalize();
          }
        });
        db.get("SELECT id FROM products WHERE name = 'MacBook Air M3'", (e, r) => {
          if (r) {
            const s = db.prepare("INSERT INTO product_specs (product_id, spec_name, spec_value, stock, price, member_price) VALUES (?, ?, ?, ?, ?, ?)");
            s.run(r.id, '颜色', '午夜色', 20, 9999, 9599);
            s.run(r.id, '颜色', '星光色', 15, 9999, 9599);
            s.run(r.id, '颜色', '银色', 10, 9999, 9599);
            s.finalize();
          }
        });
        db.get("SELECT id FROM products WHERE name = 'Apple Watch S9'", (e, r) => {
          if (r) {
            const s = db.prepare("INSERT INTO product_specs (product_id, spec_name, spec_value, stock, price, member_price) VALUES (?, ?, ?, ?, ?, ?)");
            s.run(r.id, '尺寸', '41mm', 100, 2799, 2699);
            s.run(r.id, '尺寸', '45mm', 100, 2999, 2899);
            s.finalize();
          }
        });
      }, 100);
    }
  });

  // 生成模拟会员数据
  db.get("SELECT COUNT(*) as count FROM members", (err, row) => {
    if (row.count === 0) {
      const levels = ['普通会员', '银卡会员', '金卡会员', '钻石会员'];
      const names = ['王建国', '李秀英', '张伟', '刘洋', '陈静', '赵强', '孙丽', '周杰', '吴敏', '郑伟'];
      const stmt = db.prepare(`INSERT INTO members 
        (name, phone, level, balance, points, birthday, joinDate, remark) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      names.forEach((name, i) => {
        const phone = '138' + (10000000 + i * 1234567).toString().slice(0, 8);
        const level = levels[Math.floor(Math.random() * levels.length)];
        const balance = Math.floor(Math.random() * 5000);
        const points = Math.floor(Math.random() * 10000);
        const birthday = `199${i % 10}-0${(i % 9) + 1}-${(i % 28) + 1}`;
        const joinDate = `2024-0${(i % 12) + 1}-${(i % 28) + 1}`;
        stmt.run(name, phone, level, balance, points, birthday, joinDate, '无备注');
      });
      stmt.finalize();
    }
  });

  // 用户默认数据
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare("INSERT INTO users (name, age, email) VALUES (?, ?, ?)");
      stmt.run('张三', 32, 'zhangsan@example.com');
      stmt.run('李四', 28, 'lisi@example.com');
      stmt.run('王五', 35, 'wangwu@example.com');
      stmt.finalize();
    }
  });

  // 生成4周销售记录
  db.get("SELECT COUNT(*) as count FROM sales", (err, row) => {
    if (row.count === 0) {
      const products = [
        { name: 'iPhone 15 Pro', model: 'A3104', spec: '256GB', color: '原色钛金属', baseAmount: 8999 },
        { name: 'iPhone 15', model: 'A3092', spec: '128GB', color: '蓝色', baseAmount: 5999 },
        { name: 'MacBook Pro 14', model: 'A2918', spec: '16GB+512GB', color: '深空灰', baseAmount: 14999 },
        { name: 'MacBook Air 13', model: 'A2681', spec: '8GB+256GB', color: '银色', baseAmount: 8999 },
        { name: 'AirPods Pro 2', model: 'A2968', spec: 'USB-C版', color: '白色', baseAmount: 1899 },
        { name: 'iPad Pro 11', model: 'A2759', spec: '128GB WiFi', color: '深空灰', baseAmount: 6799 },
        { name: 'Apple Watch S9', model: 'A2978', spec: '45mm GPS', color: '星光色', baseAmount: 2999 },
        { name: 'iPad Air 5', model: 'A2588', spec: '64GB WiFi', color: '粉色', baseAmount: 4799 },
      ];

      const statuses = ['已完成', '配送中', '待发货'];
      const buyers = ['王建国', '李秀英', '张伟', '刘洋', '陈静', '赵强', '孙丽', '周杰'];
      
      const stmt = db.prepare(`INSERT INTO sales 
        (product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      for (let i = 0; i < 40; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const dayOffset = Math.floor(Math.random() * 28);
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        
        const amount = p.baseAmount + Math.floor(Math.random() * 500 - 250);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
        const deviceCode = 'SN' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const phone = '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        
        stmt.run(
          p.name, amount, dateStr, status,
          p.model, p.spec, p.color, deviceCode,
          buyer, phone, '正常交易，无备注'
        );
      }
      stmt.finalize();
    }
  });

  // 初始化完成后检查库存预警
  setTimeout(async () => {
    const products = await dbAll("SELECT * FROM products WHERE status = '上架'");
    for (const p of products) {
      if (p.total_stock <= p.warning_stock) {
        await checkStockWarning(p.id);
      }
    }
  }, 1000);
});

// ========== JWT 配置 ==========
const JWT_SECRET = 'admin-system-secret-key-2024';

// ========== 登录验证中间件 ==========
app.use('/api', (req, res, next) => {
  const publicPaths = ['/login', '/forgot-password/question', '/forgot-password/reset'];
  if (publicPaths.includes(req.path)) return next();
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '未登录' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '登录已过期，请重新登录' });
    req.user = user;
    next();
  });
});

// ========== 登录接口 ==========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await dbGet("SELECT * FROM admins WHERE username = ?", [username]);
  
  if (!admin) return res.status(401).json({ error: '账号或密码错误' });
  
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: '账号或密码错误' });
  
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: admin.username });
});

// ========== 忘记密码 ==========
app.post('/api/forgot-password/question', async (req, res) => {
  const { username } = req.body;
  const admin = await dbGet("SELECT security_question FROM admins WHERE username = ?", [username]);
  if (!admin || !admin.security_question) {
    return res.status(404).json({ error: '账号不存在或未设置安全问题' });
  }
  res.json({ question: admin.security_question });
});

app.post('/api/forgot-password/reset', async (req, res) => {
  const { username, answer } = req.body;
  const admin = await dbGet("SELECT * FROM admins WHERE username = ?", [username]);
  
  if (!admin) return res.status(404).json({ error: '账号不存在' });
  if (admin.security_answer !== answer) return res.status(400).json({ error: '安全问题答案错误' });
  
  const hashed = await bcrypt.hash('123456', 10);
  await dbRun("UPDATE admins SET password = ? WHERE username = ?", [hashed, username]);
  res.json({ success: true, message: '密码已重置为初始密码：123456' });
});

// ========== 修改密码 ==========
app.post('/api/change-password', async (req, res) => {
  const { oldPassword, newPassword, securityQuestion, securityAnswer } = req.body;
  const admin = await dbGet("SELECT * FROM admins WHERE id = ?", [req.user.id]);
  
  if (!admin) return res.status(404).json({ error: '用户不存在' });
  
  const valid = await bcrypt.compare(oldPassword, admin.password);
  if (!valid) return res.status(400).json({ error: '原密码错误' });
  
  const hashed = await bcrypt.hash(newPassword, 10);
  await dbRun(
    "UPDATE admins SET password = ?, security_question = ?, security_answer = ? WHERE id = ?", 
    [hashed, securityQuestion, securityAnswer, req.user.id]
  );
  res.json({ success: true, message: '密码修改成功' });
});

// ========== 用户接口 ==========
app.get('/api/users', async (req, res) => {
  const users = await dbAll("SELECT * FROM users");
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { name, age, email } = req.body;
  const result = await dbRun("INSERT INTO users (name, age, email) VALUES (?, ?, ?)", [name, age, email]);
  const user = await dbGet("SELECT * FROM users WHERE id = ?", [result.id]);
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  await dbRun("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.put('/api/users/:id', async (req, res) => {
  const { name, age, email } = req.body;
  await dbRun("UPDATE users SET name = ?, age = ?, email = ? WHERE id = ?", [name, age, email, req.params.id]);
  const user = await dbGet("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json(user);
});

// ========== 商品管理接口 ==========
app.get('/api/products', async (req, res) => {
  const { keyword, category, status, tag } = req.query;
  let sql = "SELECT * FROM products WHERE 1=1";
  const params = [];
  
  if (keyword) {
    sql += " AND (name LIKE ? OR category LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (tag) {
    sql += " AND tags LIKE ?";
    params.push(`%${tag}%`);
  }
  sql += " ORDER BY created_at DESC";
  
  const products = await dbAll(sql, params);
  const warnings = products.filter(p => p.total_stock <= p.warning_stock && p.status === '上架').length;
  
  res.json({ products, warnings });
});

app.get('/api/products/:id', async (req, res) => {
  const product = await dbGet("SELECT * FROM products WHERE id = ?", [req.params.id]);
  const specs = await dbAll("SELECT * FROM product_specs WHERE product_id = ?", [req.params.id]);
  res.json({ ...product, specs });
});

app.post('/api/products', async (req, res) => {
  const { name, category, cover_image, description, detail_images, video_url, status, tags,
          original_price, sale_price, member_price, line_price, cost_price, total_stock, warning_stock,
          is_multi_spec, schedule_time, specs } = req.body;
  const now = new Date().toISOString();
  
  const result = await dbRun(
    `INSERT INTO products (name, category, cover_image, description, detail_images, video_url, status, tags,
     original_price, sale_price, member_price, line_price, cost_price, total_stock, warning_stock,
     is_multi_spec, schedule_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, cover_image, description, JSON.stringify(detail_images || []), video_url, status, JSON.stringify(tags || []),
     original_price, sale_price, member_price, line_price, cost_price, total_stock, warning_stock,
     is_multi_spec ? 1 : 0, schedule_time, now]
  );
  
  if (specs && specs.length > 0) {
    const stmt = db.prepare("INSERT INTO product_specs (product_id, spec_name, spec_value, stock, price, member_price) VALUES (?, ?, ?, ?, ?, ?)");
    for (const s of specs) {
      stmt.run(result.id, s.spec_name, s.spec_value, s.stock, s.price, s.member_price);
    }
    stmt.finalize();
  }
  
  await checkStockWarning(result.id);
  await addOperationLog('新增商品', `添加商品 ${name}`);
  
  const product = await dbGet("SELECT * FROM products WHERE id = ?", [result.id]);
  res.json(product);
});

app.put('/api/products/:id', async (req, res) => {
  const { name, category, cover_image, description, detail_images, video_url, status, tags,
          original_price, sale_price, member_price, line_price, cost_price, total_stock, warning_stock,
          is_multi_spec, schedule_time, specs } = req.body;
  
  const oldProduct = await dbGet("SELECT name FROM products WHERE id = ?", [req.params.id]);
  
  await dbRun(
    `UPDATE products SET name=?, category=?, cover_image=?, description=?, detail_images=?, video_url=?,
     status=?, tags=?, original_price=?, sale_price=?, member_price=?, line_price=?, cost_price=?,
     total_stock=?, warning_stock=?, is_multi_spec=?, schedule_time=? WHERE id=?`,
    [name, category, cover_image, description, JSON.stringify(detail_images || []), video_url, status,
     JSON.stringify(tags || []), original_price, sale_price, member_price, line_price, cost_price,
     total_stock, warning_stock, is_multi_spec ? 1 : 0, schedule_time, req.params.id]
  );
  
  await dbRun("DELETE FROM product_specs WHERE product_id = ?", [req.params.id]);
  if (specs && specs.length > 0) {
    const stmt = db.prepare("INSERT INTO product_specs (product_id, spec_name, spec_value, stock, price, member_price) VALUES (?, ?, ?, ?, ?, ?)");
    for (const s of specs) {
      stmt.run(req.params.id, s.spec_name, s.spec_value, s.stock, s.price, s.member_price);
    }
    stmt.finalize();
  }
  
  await checkStockWarning(req.params.id);
  await addOperationLog('修改商品', `修改商品 ${oldProduct?.name || name}`);
  
  const product = await dbGet("SELECT * FROM products WHERE id = ?", [req.params.id]);
  res.json(product);
});

app.delete('/api/products/:id', async (req, res) => {
  const product = await dbGet("SELECT name FROM products WHERE id = ?", [req.params.id]);
  await dbRun("DELETE FROM product_specs WHERE product_id = ?", [req.params.id]);
  await dbRun("DELETE FROM products WHERE id = ?", [req.params.id]);
  
  await addOperationLog('删除商品', `删除商品 ${product?.name}`);
  res.json({ success: true });
});

// ========== 批量操作（带日志）==========
app.post('/api/products/batch-status', async (req, res) => {
  const { ids, status } = req.body;
  const placeholders = ids.map(() => '?').join(',');
  
  const products = await dbAll(`SELECT name FROM products WHERE id IN (${placeholders})`, ids);
  const productNames = products.map(p => p.name).join(', ');
  
  await dbRun(`UPDATE products SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
  
  const action = status === '上架' ? '批量上架' : '批量下架';
  await addOperationLog(action, `${productNames} 等 ${ids.length} 个商品`);
  
  res.json({ success: true });
});

app.post('/api/products/batch-stock', async (req, res) => {
  const { ids, addStock } = req.body;
  if (!ids || ids.length === 0 || addStock === undefined) {
    return res.status(400).json({ error: '参数错误' });
  }
  
  const placeholders = ids.map(() => '?').join(',');
  const products = await dbAll(`SELECT name, total_stock FROM products WHERE id IN (${placeholders})`, ids);
  
  await dbRun(`UPDATE products SET total_stock = total_stock + ? WHERE id IN (${placeholders})`, [addStock, ...ids]);
  
  for (const id of ids) {
    await checkStockWarning(id);
  }
  
  const productNames = products.map(p => p.name).join(', ');
  await addOperationLog('批量入库', `为 ${productNames} 等 ${ids.length} 个商品入库 ${addStock} 件`);
  
  res.json({ success: true, message: `已为 ${ids.length} 个商品入库 ${addStock} 件` });
});

// ========== 会员档案接口 ==========
app.get('/api/members', async (req, res) => {
  const { keyword } = req.query;
  let sql = "SELECT * FROM members WHERE 1=1";
  const params = [];
  
  if (keyword) {
    sql += " AND (name LIKE ? OR phone LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += " ORDER BY joinDate DESC";
  
  const members = await dbAll(sql, params);
  res.json(members);
});

app.get('/api/members/:id', async (req, res) => {
  const member = await dbGet("SELECT * FROM members WHERE id = ?", [req.params.id]);
  res.json(member || {});
});

app.get('/api/members/:id/orders', async (req, res) => {
  const member = await dbGet("SELECT name FROM members WHERE id = ?", [req.params.id]);
  if (!member) return res.json([]);
  const orders = await dbAll("SELECT * FROM sales WHERE buyer = ? ORDER BY date DESC", [member.name]);
  res.json(orders);
});

// ========== 销售/订单接口 ==========
app.get('/api/sales', async (req, res) => {
  const { dateFrom, dateTo, keyword } = req.query;
  
  let sql = "SELECT * FROM sales WHERE 1=1";
  const params = [];
  
  if (dateFrom) {
    sql += " AND date >= ?";
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += " AND date <= ?";
    params.push(dateTo);
  }
  if (keyword) {
    sql += " AND (product LIKE ? OR buyer LIKE ? OR device_code LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  sql += " ORDER BY date DESC";
  
  const sales = await dbAll(sql, params);
  res.json(sales);
});

app.post('/api/sales', async (req, res) => {
  const { product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark } = req.body;
  const result = await dbRun(
    `INSERT INTO sales (product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark]
  );
  const sale = await dbGet("SELECT * FROM sales WHERE id = ?", [result.id]);
  
  await addNotification(
    'new_sale',
    '新订单',
    `${product} 售出 ¥${amount}，买家：${buyer || '未知'}`
  );
  
  const relatedProduct = await dbGet("SELECT * FROM products WHERE name = ?", [product]);
  if (relatedProduct) {
    await checkStockWarning(relatedProduct.id);
  }
  
  res.json(sale);
});

app.delete('/api/sales/:id', async (req, res) => {
  const sale = await dbGet("SELECT product FROM sales WHERE id = ?", [req.params.id]);
  await dbRun("DELETE FROM sales WHERE id = ?", [req.params.id]);
  
  await addOperationLog('删除订单', `删除订单 ${sale?.product}`);
  res.json({ success: true });
});

app.put('/api/sales/:id', async (req, res) => {
  const { product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark } = req.body;
  await dbRun(
    `UPDATE sales SET product=?, amount=?, date=?, status=?, model=?, spec=?, color=?, device_code=?, buyer=?, buyer_phone=?, remark=? 
     WHERE id=?`,
    [product, amount, date, status, model, spec, color, device_code, buyer, buyer_phone, remark, req.params.id]
  );
  const sale = await dbGet("SELECT * FROM sales WHERE id = ?", [req.params.id]);
  res.json(sale);
});

// ========== 通知接口 ==========
app.get('/api/notifications', async (req, res) => {
  const rows = await dbAll("SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50");
  res.json(rows);
});

app.get('/api/notifications/unread-count', async (req, res) => {
  const row = await dbGet("SELECT COUNT(*) as count FROM notifications WHERE isRead = 0");
  res.json({ count: row.count });
});

app.post('/api/notifications/read', async (req, res) => {
  const { id } = req.body;
  if (id === 'all') {
    await dbRun("UPDATE notifications SET isRead = 1");
  } else {
    await dbRun("UPDATE notifications SET isRead = 1 WHERE id = ?", [id]);
  }
  res.json({ success: true });
});

app.delete('/api/notifications/:id', async (req, res) => {
  await dbRun("DELETE FROM notifications WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ========== 仪表盘数据中心 ==========
app.get('/api/dashboard/stats', async (req, res) => {
  const userRow = await dbGet("SELECT COUNT(*) as count FROM users");
  const allSales = await dbAll("SELECT amount, date FROM sales");
  
  const totalOrders = allSales.length;
  const totalRevenue = allSales.reduce((s, r) => s + r.amount, 0);
  
  const dates = [...new Set(allSales.map(s => s.date))].sort().slice(-7);
  const recentSales = allSales.filter(s => dates.includes(s.date));
  const recentOrders = recentSales.length;
  const recentRevenue = recentSales.reduce((s, r) => s + r.amount, 0);
  
  const allDates = [...new Set(allSales.map(s => s.date))].sort();
  const prevDates = allDates.slice(-14, -7);
  const prevSales = allSales.filter(s => prevDates.includes(s.date));
  const prevOrders = prevSales.length;
  const prevRevenue = prevSales.reduce((s, r) => s + r.amount, 0);
  
  const orderChange = prevOrders === 0 ? 100 : ((recentOrders - prevOrders) / prevOrders * 100).toFixed(1);
  const revenueChange = prevRevenue === 0 ? 100 : ((recentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1);
  
  const totalProducts = await dbGet("SELECT COUNT(*) as count FROM products");
  const onSaleProducts = await dbGet("SELECT COUNT(*) as count FROM products WHERE status = '上架'");
  const avgOrderValue = recentOrders === 0 ? 0 : Math.round(recentRevenue / recentOrders);
  const lastWeekAvg = prevOrders === 0 ? 0 : Math.round(prevRevenue / prevOrders);
  const avgChange = lastWeekAvg === 0 ? 100 : ((avgOrderValue - lastWeekAvg) / lastWeekAvg * 100).toFixed(1);
  
  res.json({
    totalUsers: userRow.count,
    totalProducts: totalProducts.count,
    onSaleProducts: onSaleProducts.count,
    weekOrders: recentOrders || totalOrders,
    weekRevenue: recentRevenue || totalRevenue,
    lastWeekOrders: prevOrders,
    lastWeekRevenue: prevRevenue,
    avgOrderValue,
    lastWeekAvg,
    avgChange: parseFloat(avgChange),
    isAvgUp: avgOrderValue >= lastWeekAvg,
    orderChange: parseFloat(orderChange),
    revenueChange: parseFloat(revenueChange),
    isOrderUp: recentOrders >= prevOrders,
    isRevenueUp: recentRevenue >= prevRevenue,
  });
});

app.get('/api/dashboard/trend', async (req, res) => {
  const sales = await dbAll("SELECT date, amount FROM sales ORDER BY date");
  const dates = [...new Set(sales.map(s => s.date))].slice(-7);
  
  const result = dates.map(dateStr => {
    const d = new Date(dateStr);
    const dayLabel = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    const daySales = sales.filter(s => s.date === dateStr);
    
    return {
      name: dayLabel,
      date: dateStr,
      orders: daySales.length,
      revenue: daySales.reduce((s, r) => s + r.amount, 0)
    };
  });
  
  res.json(result);
});

app.get('/api/dashboard/top-products', async (req, res) => {
  const rows = await dbAll(`
    SELECT product, COUNT(*) as count, SUM(amount) as total 
    FROM sales 
    GROUP BY product 
    ORDER BY count DESC 
    LIMIT 5
  `);
  res.json(rows);
});

// 生产环境
app.use(express.static(join(__dirname, 'dist')));

app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  }
});

server.listen(3001, () => {
  console.log('✅ 后端已启动：http://localhost:3001');
  console.log('✅ WebSocket 已启动：ws://localhost:3001');
});
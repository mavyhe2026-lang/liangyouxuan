require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 9000;

// ==================== 安全中间件 ====================

// 安全 HTTP 头
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS 配置（生产环境限制来源）
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://3.112.41.128:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// 全局限流：每 IP 每 15 分钟最多 200 次请求
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: '请求过于频繁，请稍后重试' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// 登录接口严格限流：每 IP 每 15 分钟最多 10 次
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试过多，请 15 分钟后重试' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ==================== 路由 ====================
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/admin', loginLimiter, require('./routes/admin'));

// 健康检查
app.get('/health', (req, res) => res.json({
  status: 'ok',
  version: '2.0.0',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV,
}));

// 404 处理
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message });
});

// ==================== 启动 ====================
const { initDb } = require('./db');
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`   环境: ${process.env.NODE_ENV}`);
    console.log(`   Admin: POST /api/admin/login  { username:"admin", password:"admin123" }`);
  });
}).catch(err => {
  console.error('❌ 数据库初始化失败:', err);
  process.exit(1);
});

module.exports = app;

# 粮优选 · 电商网站

一个完整的电商网站，专营东北大米和新疆大枣。

## 技术栈

| 层次 | 技术 |
|------|------|
| 后端 | Express.js + SQLite (better-sqlite3) |
| 前端 | Next.js 14 + Tailwind CSS |
| 多语言 | next-intl (中文/English/한국어) |
| 支付 | 微信支付 + 支付宝（模拟，预留真实接口） |
| 物流 | 京东物流（模拟，预留真实接口） |
| 状态 | Zustand (购物车) |

## 快速启动

### 1. 启动后端

```bash
cd /workspace/ecommerce/backend
npm install
cp .env.example .env
node src/index.js
# 后端运行在 http://localhost:9000
```

### 2. 启动前端

```bash
cd /workspace/ecommerce/frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

## 功能访问

| 地址 | 功能 |
|------|------|
| http://localhost:3000/zh | 中文首页 |
| http://localhost:3000/en | English Home |
| http://localhost:3000/ko | 한국어 홈 |
| http://localhost:3000/zh/products | 产品列表 |
| http://localhost:3000/zh/cart | 购物车 |
| http://localhost:3000/zh/checkout | 结账 |
| http://localhost:3000/zh/admin | 后台管理 |

## 后台管理

- 地址: http://localhost:3000/zh/admin
- 用户名: `admin`
- 密码: `admin123`

### 后台功能
- **控制台**: 总览订单数、收入、产品数
- **产品管理**: 查看产品、上架/下架
- **订单管理**: 查看订单列表、修改状态
- **物流管理**: 一键创建京东运单、同步物流进度

## API 接口

### 产品
- `GET /api/products` - 产品列表
- `GET /api/products/:id` - 产品详情

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/orders/:id` - 订单详情

### 支付
- `POST /api/payment/create` - 创建支付
- `POST /api/payment/simulate` - 模拟支付（演示用）
- `GET /api/payment/status/:orderId` - 支付状态

### 物流
- `GET /api/logistics/:orderId` - 查询物流
- `POST /api/logistics/create` - 创建运单（需管理员Token）
- `POST /api/logistics/sync/:orderId` - 同步物流（需管理员Token）

### 管理员
- `POST /api/admin/login` - 登录，返回JWT Token
- `GET /api/admin/stats` - 统计数据

## 集成真实支付

编辑 `backend/.env`，填写以下配置：

```env
# 微信支付
WECHAT_APP_ID=wx...
WECHAT_MCH_ID=...
WECHAT_API_KEY=...

# 支付宝
ALIPAY_APP_ID=...
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...
```

然后修改 `backend/src/routes/payment.js` 中的支付逻辑，替换模拟代码。

## 集成真实京东物流

编辑 `backend/.env`：

```env
JD_LOGISTICS_APP_KEY=...
JD_LOGISTICS_APP_SECRET=...
JD_LOGISTICS_CUSTOMER_CODE=...
```

修改 `backend/src/routes/logistics.js` 中的创建/查询逻辑。

## 产品数据

系统启动时自动初始化示例数据：

| 产品 | 规格 | 价格 |
|------|------|------|
| 东北优质大米 | 5kg | ¥49.00 |
| 东北优质大米 | 10kg | ¥89.00 |
| 东北优质大米 | 25kg | ¥199.00 |
| 新疆特级大枣 | 250g | ¥29.00 |
| 新疆特级大枣 | 500g | ¥49.00 |
| 新疆特级大枣 | 1kg | ¥88.00 |

## 目录结构

```
ecommerce/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express 入口
│   │   ├── db.js             # SQLite 数据库 + 初始化数据
│   │   ├── routes/
│   │   │   ├── products.js   # 产品 API
│   │   │   ├── orders.js     # 订单 API
│   │   │   ├── payment.js    # 支付 API（模拟）
│   │   │   ├── logistics.js  # 物流 API（模拟）
│   │   │   └── admin.js      # 后台 API
│   │   └── middleware/
│   │       └── auth.js       # JWT 认证
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── page.tsx          # 首页
│   │   │       ├── products/         # 产品列表+详情
│   │   │       ├── cart/             # 购物车
│   │   │       ├── checkout/         # 结账
│   │   │       ├── payment/[orderId] # 支付页
│   │   │       ├── orders/[id]       # 订单详情
│   │   │       └── admin/            # 后台管理
│   │   ├── components/
│   │   │   ├── Navbar.tsx    # 导航栏（含语言切换）
│   │   │   └── ProductCard.tsx
│   │   ├── lib/
│   │   │   └── api.ts        # API 调用封装
│   │   └── store/
│   │       └── cart.ts       # 购物车状态 (Zustand)
│   ├── messages/
│   │   ├── zh.json   # 中文
│   │   ├── en.json   # English
│   │   └── ko.json   # 한국어
│   └── package.json
└── README.md
```

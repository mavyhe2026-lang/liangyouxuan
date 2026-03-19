# 粮优选电商网站 · 技术文档

> 整理时间：2026-03-19  
> 用于阿里云迁移参考

---

## 一、运行环境

| 项目 | 版本 | 说明 |
|------|------|------|
| Node.js | v22.22.0 | 必须 ≥ 18，推荐 20 LTS 或 22 |
| npm | 10.9.4 | 随 Node.js 一起安装 |
| 操作系统 | Ubuntu 22.04 | Linux 均可兼容 |
| 进程管理 | pm2 | 需全局安装：`npm i -g pm2` |

---

## 二、技术栈

### 后端（Backend）
| 技术 | 版本 | 用途 |
|------|------|------|
| Express.js | ^4.22.1 | Web 框架 |
| better-sqlite3 | ^9.6.0 | SQLite 数据库驱动（同步操作） |
| bcryptjs | ^2.4.3 | 密码加密 |
| jsonwebtoken | ^9.0.3 | JWT 管理员认证 |
| cors | ^2.8.6 | 跨域请求处理 |
| dotenv | ^16.6.1 | 环境变量加载 |
| morgan | ^1.10.1 | HTTP 请求日志 |
| multer | ^1.4.5-lts.1 | 文件上传 |
| uuid | ^9.0.1 | 生成唯一 ID |

### 前端（Frontend）
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.1.0 | React 全栈框架（SSR/SSG） |
| React | ^18.2.0 | UI 框架 |
| Tailwind CSS | ^3.3.0 | CSS 样式框架 |
| next-intl | ^3.9.1 | 多语言国际化（中/英/韩） |
| axios | ^1.6.7 | HTTP 请求 |
| zustand | ^4.5.0 | 购物车状态管理 |
| lucide-react | ^0.323.0 | 图标库 |
| TypeScript | ^5 | 类型安全 |

---

## 三、数据库

| 项目 | 说明 |
|------|------|
| 类型 | SQLite（文件型数据库） |
| 驱动 | better-sqlite3（同步 API，性能优秀） |
| 文件路径 | `backend/data/shop.db` |
| 迁移说明 | ⚠️ 迁移时需一并复制 `shop.db` 文件，否则数据丢失 |

### 数据表结构
| 表名 | 说明 |
|------|------|
| products | 产品信息（中/英/韩三语） |
| product_variants | 产品规格（尺寸/价格/库存） |
| orders | 订单主表 |
| order_items | 订单商品明细 |
| logistics_tracks | 物流跟踪记录 |
| admins | 管理员账号 |

### ⚠️ 阿里云迁移建议
SQLite 适合小型项目，商业使用建议迁移到 **MySQL 或 RDS**：
- 阿里云 RDS MySQL：高可用、自动备份
- 迁移工作量：中等（需改写 better-sqlite3 为 mysql2）

---

## 四、端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Next.js | 3000 | 用户访问入口 |
| 后端 Express | 9000 | API 服务 |

### 防火墙需放行
- TCP 22（SSH）
- TCP 80（HTTP，可选）
- TCP 443（HTTPS，可选）
- TCP 3000（前端）
- TCP 9000（后端 API）

---

## 五、安全配置

### 已实现
| 项目 | 状态 | 说明 |
|------|------|------|
| 密码加密 | ✅ | bcryptjs hash，salt rounds=10 |
| JWT 认证 | ✅ | 管理员接口全部需要 Bearer Token |
| Token 有效期 | ✅ | 24 小时自动过期 |
| CORS | ✅ | 已配置跨域 |
| 环境变量 | ✅ | 敏感信息通过 .env 注入 |

### ⚠️ 上线前必须加固
| 项目 | 优先级 | 说明 |
|------|------|------|
| 修改 JWT_SECRET | 🔴 高 | 当前用默认值，必须改成随机长字符串 |
| 修改 admin 密码 | 🔴 高 | 当前是 admin123，上线前必须修改 |
| 启用 HTTPS | 🔴 高 | 配置 SSL 证书（阿里云免费证书可申请） |
| Rate Limiting | 🟡 中 | 防止暴力破解，建议加 express-rate-limit |
| Helmet.js | 🟡 中 | 添加安全 HTTP 头 |
| 输入验证 | 🟡 中 | 建议加 joi 或 zod 做参数校验 |
| CORS 限制 | 🟡 中 | 目前全部放行，上线后应限制为自己域名 |

---

## 六、环境变量（backend/.env）

```env
PORT=9000
JWT_SECRET=【必须改成随机字符串，至少32位】
NODE_ENV=production

# 微信支付（接入真实支付时填写）
WECHAT_APP_ID=
WECHAT_MCH_ID=
WECHAT_API_KEY=
WECHAT_NOTIFY_URL=https://yourdomain.com/api/payment/notify/wechat

# 支付宝（接入真实支付时填写）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=https://yourdomain.com/api/payment/notify/alipay

# 京东物流（接入真实物流时填写）
JD_LOGISTICS_APP_KEY=
JD_LOGISTICS_APP_SECRET=
JD_LOGISTICS_CUSTOMER_CODE=
```

### 前端环境变量（frontend/.env.local）
```env
NEXT_PUBLIC_API_URL=http://服务器IP:9000
# 上线后改为：https://api.yourdomain.com
```

---

## 七、部署架构（当前）

```
用户浏览器
    ↓ HTTP :3000
Next.js 前端（pm2 托管）
    ↓ HTTP localhost:9000
Express 后端（pm2 托管）
    ↓
SQLite 文件（shop.db）
```

## 八、阿里云部署推荐架构

```
用户浏览器
    ↓ HTTPS :443
阿里云 SLB（负载均衡）
    ↓
阿里云 ECS（Ubuntu 22.04）
  ├── Nginx（反向代理，处理 SSL）
  │     ├── / → Next.js :3000
  │     └── /api → Express :9000
  ├── Next.js（pm2 托管）
  └── Express（pm2 托管）
        ↓
阿里云 RDS MySQL（替换 SQLite）
```

---

## 九、迁移到阿里云检查清单

- [ ] ECS 安装 Node.js 22 LTS
- [ ] 全局安装 pm2
- [ ] 安装 Nginx 并配置反向代理
- [ ] 申请 SSL 证书（阿里云免费证书）
- [ ] 克隆代码：`git clone https://github.com/mavyhe2026-lang/liangyouxuan.git`
- [ ] 修改 JWT_SECRET 为强密码
- [ ] 修改 admin 账号密码
- [ ] 修改前端 NEXT_PUBLIC_API_URL 为域名
- [ ] 重新 build 前端
- [ ] 迁移 SQLite 数据（或改接 RDS MySQL）
- [ ] pm2 启动并设置开机自启
- [ ] 测试所有功能

---

## 十、功能现状

| 功能 | 状态 | 说明 |
|------|------|------|
| 产品展示 | ✅ 完成 | 支持分类筛选 |
| 购物车 | ✅ 完成 | 本地持久化 |
| 下单流程 | ✅ 完成 | 含收货地址 |
| 微信/支付宝支付 | ⚠️ 模拟 | 需接入真实 API |
| 订单管理（后台） | ✅ 完成 | |
| 物流管理（后台） | ⚠️ 模拟 | 需接入京东物流 API |
| 多语言 | ✅ 完成 | 中/英/韩 |
| 用户注册登录 | ❌ 未做 | 目前无用户系统 |
| 商品搜索 | ❌ 未做 | |
| SEO | ❌ 未做 | |
| HTTPS | ❌ 未做 | 需配置 SSL |

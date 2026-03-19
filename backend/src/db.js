const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

let sequelize;

if (process.env.USE_SQLITE === 'true' || (process.env.NODE_ENV === 'development' && !process.env.DB_HOST)) {
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/shop.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
  console.log('📦 使用 SQLite 数据库');
} else {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    timezone: '+08:00',
  });
  console.log('🐬 使用 MySQL 数据库');
}

// ==================== 模型定义 ====================

// 分类模型（支持多级，parent_id=null 为一级分类）
const Category = sequelize.define('Category', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  name_zh: { type: DataTypes.STRING(100), allowNull: false },
  name_en: { type: DataTypes.STRING(100), allowNull: false },
  name_ko: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },  // URL 友好标识，如 rice、rice-glutinous
  parent_id: { type: DataTypes.STRING(36), defaultValue: null },           // null = 一级分类
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  icon: { type: DataTypes.STRING(10), defaultValue: '' },                  // emoji 图标
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'categories', underscored: true });

// 自关联（父子分类）
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  name_zh: { type: DataTypes.STRING(200), allowNull: false },
  name_en: { type: DataTypes.STRING(200), allowNull: false },
  name_ko: { type: DataTypes.STRING(200), allowNull: false },
  description_zh: { type: DataTypes.TEXT, defaultValue: '' },
  description_en: { type: DataTypes.TEXT, defaultValue: '' },
  description_ko: { type: DataTypes.TEXT, defaultValue: '' },
  category_id: { type: DataTypes.STRING(36), allowNull: true },  // 关联二级分类
  category: { type: DataTypes.STRING(50), allowNull: false },    // 保留兼容旧数据（rice/dates）
  image_url: { type: DataTypes.STRING(500), defaultValue: '' },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'products', underscored: true });

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  product_id: { type: DataTypes.STRING(36), allowNull: false },
  sku: { type: DataTypes.STRING(100), allowNull: false },
  spec: { type: DataTypes.STRING(50), allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  original_price: { type: DataTypes.INTEGER, defaultValue: null },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'product_variants', underscored: true, timestamps: false });

const Order = sequelize.define('Order', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  order_no: { type: DataTypes.STRING(50), unique: true },
  user_name: { type: DataTypes.STRING(100), allowNull: false },
  user_phone: { type: DataTypes.STRING(20), allowNull: false },
  user_email: { type: DataTypes.STRING(200), defaultValue: null },
  address: { type: DataTypes.STRING(500), allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  province: { type: DataTypes.STRING(100), allowNull: false },
  postal_code: { type: DataTypes.STRING(20), defaultValue: null },
  total_amount: { type: DataTypes.INTEGER, allowNull: false },
  payment_method: { type: DataTypes.ENUM('wechat', 'alipay'), defaultValue: 'wechat' },
  payment_status: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  payment_time: { type: DataTypes.DATE, defaultValue: null },
  order_status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
  logistics_no: { type: DataTypes.STRING(100), defaultValue: null },
  logistics_company: { type: DataTypes.STRING(100), defaultValue: null },
  note: { type: DataTypes.TEXT, defaultValue: null },
}, { tableName: 'orders', underscored: true });

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  order_id: { type: DataTypes.STRING(36), allowNull: false },
  product_id: { type: DataTypes.STRING(36), allowNull: false },
  variant_id: { type: DataTypes.STRING(36), allowNull: false },
  product_name: { type: DataTypes.STRING(200), allowNull: false },
  spec: { type: DataTypes.STRING(50), allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'order_items', underscored: true, timestamps: false });

const LogisticsTrack = sequelize.define('LogisticsTrack', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  order_id: { type: DataTypes.STRING(36), allowNull: false },
  logistics_no: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.STRING(50) },
  description: { type: DataTypes.STRING(500) },
  location: { type: DataTypes.STRING(200) },
  track_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'logistics_tracks', underscored: true, timestamps: false });

const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(200), allowNull: false },
}, { tableName: 'admins', underscored: true });

// ==================== 关联关系 ====================
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category_info' });
Category.hasMany(Product, { foreignKey: 'category_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(LogisticsTrack, { foreignKey: 'order_id', as: 'logistics_tracks' });

// ==================== 初始化 ====================
async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const adminCount = await Admin.count();
  if (adminCount === 0) {
    await seedData();
    console.log('✅ 初始数据已写入');
  }
  return sequelize;
}

async function seedData() {
  await Admin.create({ username: 'admin', password: bcrypt.hashSync('admin123', 10) });

  // ====== 一级分类 ======
  const catRice = await Category.create({ name_zh: '大米', name_en: 'Rice', name_ko: '쌀', slug: 'rice', sort_order: 1, icon: '🍚' });
  const catDates = await Category.create({ name_zh: '大枣', name_en: 'Red Dates', name_ko: '대추', slug: 'dates', sort_order: 2, icon: '🍎' });

  // ====== 二级分类：大米 ======
  const catJingMi = await Category.create({ name_zh: '粳米', name_en: 'Japonica Rice', name_ko: '자포니카 쌀', slug: 'rice-japonica', parent_id: catRice.id, sort_order: 1 });
  const catXianMi = await Category.create({ name_zh: '籼米', name_en: 'Indica Rice', name_ko: '인디카 쌀', slug: 'rice-indica', parent_id: catRice.id, sort_order: 2 });
  const catNuoMi = await Category.create({ name_zh: '糯米', name_en: 'Glutinous Rice', name_ko: '찹쌀', slug: 'rice-glutinous', parent_id: catRice.id, sort_order: 3 });

  // ====== 二级分类：大枣 ======
  const catHeTian = await Category.create({ name_zh: '和田枣', name_en: 'Hetian Dates', name_ko: '허톈 대추', slug: 'dates-hetian', parent_id: catDates.id, sort_order: 1 });
  const catHuiZao = await Category.create({ name_zh: '灰枣', name_en: 'Grey Dates', name_ko: '회색 대추', slug: 'dates-grey', parent_id: catDates.id, sort_order: 2 });
  const catDongZao = await Category.create({ name_zh: '冬枣', name_en: 'Winter Dates', name_ko: '동대추', slug: 'dates-winter', parent_id: catDates.id, sort_order: 3 });

  // ====== 产品（关联二级分类）======
  const rice = await Product.create({
    name_zh: '东北优质大米（粳米）', name_en: 'Premium Northeast Japonica Rice', name_ko: '동북 프리미엄 자포니카 쌀',
    description_zh: '来自东北黑土地，粒粒饱满，口感软糯，营养丰富。',
    description_en: 'From the black soil of Northeast China, each grain is full and nutritious.',
    description_ko: '중국 동북부 비옥한 흑토지에서 재배한 프리미엄 쌀.',
    category: 'rice', category_id: catJingMi.id,
    image_url: 'https://picsum.photos/seed/rice/800/600',
  });
  const dates = await Product.create({
    name_zh: '新疆特级和田枣', name_en: 'Xinjiang Premium Hetian Dates', name_ko: '신장 프리미엄 허톈 대추',
    description_zh: '来自新疆和田，果肉厚实，甜度适中，富含维生素和矿物质。',
    description_en: 'From Hetian, Xinjiang. Thick flesh with moderate sweetness.',
    description_ko: '신장 허톈 지역 특산 대추.',
    category: 'dates', category_id: catHeTian.id,
    image_url: 'https://picsum.photos/seed/dates/800/600',
  });

  for (const [spec, price, orig, stock] of [['5kg',4900,5800,200],['10kg',8900,10800,150],['25kg',19900,24800,80]])
    await ProductVariant.create({ product_id: rice.id, sku: `RICE-${spec}`, spec, price, original_price: orig, stock });
  for (const [spec, price, orig, stock] of [['250g',2900,3800,300],['500g',4900,6800,250],['1kg',8800,11800,180]])
    await ProductVariant.create({ product_id: dates.id, sku: `DATE-${spec}`, spec, price, original_price: orig, stock });
}

module.exports = { sequelize, Category, Product, ProductVariant, Order, OrderItem, LogisticsTrack, Admin, initDb };

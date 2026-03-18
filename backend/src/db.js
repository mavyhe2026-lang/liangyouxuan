const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/shop.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    initSchema();
    seedData();
    saveDb();
  }
  return db;
}

function initSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name_zh TEXT, name_en TEXT, name_ko TEXT, description_zh TEXT, description_en TEXT, description_ko TEXT, category TEXT, image_url TEXT, status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS product_variants (id TEXT PRIMARY KEY, product_id TEXT, sku TEXT, spec TEXT, price INTEGER, original_price INTEGER, stock INTEGER DEFAULT 0)`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_no TEXT, user_name TEXT, user_phone TEXT, user_email TEXT, address TEXT, city TEXT, province TEXT, postal_code TEXT, total_amount INTEGER, payment_method TEXT, payment_status TEXT DEFAULT 'pending', payment_time TEXT, order_status TEXT DEFAULT 'pending', logistics_no TEXT, logistics_company TEXT, note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, product_id TEXT, variant_id TEXT, product_name TEXT, spec TEXT, price INTEGER, quantity INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS logistics_tracks (id TEXT PRIMARY KEY, order_id TEXT, logistics_no TEXT, status TEXT, description TEXT, location TEXT, track_time TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, username TEXT, password TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
}

function seedData() {
  const riceId = uuidv4();
  const dateId = uuidv4();
  db.run('INSERT INTO admins VALUES (?,?,?,?)', [uuidv4(), 'admin', bcrypt.hashSync('admin123', 10), new Date().toISOString()]);
  db.run('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [riceId,'东北优质大米','Premium Northeast Rice','동북 프리미엄 쌀','来自东北黑土地，粒粒饱满，口感软糯，营养丰富。','From the black soil of Northeast China, each grain is full and nutritious.','중국 동북부 비옥한 흑토지에서 재배한 프리미엄 쌀.','rice','https://picsum.photos/seed/rice/800/600','active',new Date().toISOString(),new Date().toISOString()]);
  db.run('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [dateId,'新疆特级大枣','Xinjiang Premium Red Dates','신장 프리미엄 대추','来自新疆和田，果肉厚实，甜度适中，富含维生素和矿物质。','From Hetian, Xinjiang. Thick flesh with moderate sweetness.','신장 허톈 지역 특산 대추.','dates','https://picsum.photos/seed/dates/800/600','active',new Date().toISOString(),new Date().toISOString()]);
  for (const [spec,price,orig,stock] of [['5kg',4900,5800,200],['10kg',8900,10800,150],['25kg',19900,24800,80]])
    db.run('INSERT INTO product_variants VALUES (?,?,?,?,?,?,?)', [uuidv4(),riceId,`RICE-${spec}`,spec,price,orig,stock]);
  for (const [spec,price,orig,stock] of [['250g',2900,3800,300],['500g',4900,6800,250],['1kg',8800,11800,180]])
    db.run('INSERT INTO product_variants VALUES (?,?,?,?,?,?,?)', [uuidv4(),dateId,`DATE-${spec}`,spec,price,orig,stock]);
}

function all(query, params = []) {
  try {
    const stmt = db.prepare(query);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  } catch(e) { console.error('SQL all:', e.message, query); return []; }
}

function get(query, params = []) {
  return all(query, params)[0] || null;
}

function run(query, params = []) {
  try { db.run(query, params); saveDb(); } catch(e) { console.error('SQL run:', e.message, query); throw e; }
}

module.exports = { initDb, all, get, run };

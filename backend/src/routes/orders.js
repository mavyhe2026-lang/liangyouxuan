const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth()+1).padStart(2,'0') +
    String(now.getDate()).padStart(2,'0') +
    String(now.getHours()).padStart(2,'0') +
    String(now.getMinutes()).padStart(2,'0') +
    String(now.getSeconds()).padStart(2,'0');
  return 'ORD' + ts + Math.floor(Math.random()*1000).toString().padStart(3,'0');
}

// POST /api/orders - create order
router.post('/', (req, res) => {
  const body = req.body;
  const user_name = body.user_name;
  const user_phone = body.user_phone;
  const user_email = body.user_email || null;
  const address = body.address;
  const city = body.city;
  const province = body.province;
  const postal_code = body.postal_code || null;
  const payment_method = body.payment_method || 'wechat';
  const note = body.note || null;
  const items = body.items || [];

  if (!items.length) return res.status(400).json({ error: 'No items' });

  let total = 0;
  const enrichedItems = [];
  for (const item of items) {
    const variant = get('SELECT * FROM product_variants WHERE id = ?', [item.variant_id]);
    if (!variant) return res.status(400).json({ error: `Variant not found: ${item.variant_id}` });
    if (variant.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${variant.sku}` });
    const product = get('SELECT * FROM products WHERE id = ?', [variant.product_id]);
    total += variant.price * item.quantity;
    enrichedItems.push({ variant, product, quantity: item.quantity });
  }

  const orderId = uuidv4();
  const orderNo = generateOrderNo();

  run(`INSERT INTO orders (id, order_no, user_name, user_phone, user_email, address, city, province, postal_code, total_amount, payment_method, note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orderId, orderNo, user_name, user_phone, user_email, address, city, province, postal_code, total, payment_method, note]
  );

  for (const { variant, product, quantity } of enrichedItems) {
    run(`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, spec, price, quantity) VALUES (?,?,?,?,?,?,?,?)`,
      [uuidv4(), orderId, product.id, variant.id, product.name_zh, variant.spec, variant.price, quantity]
    );
    run('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [quantity, variant.id]);
  }

  const order = getOrderFull(orderId);
  res.status(201).json({ data: order });
});

// GET /api/orders (admin)
router.get('/', authMiddleware, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { query += ' AND order_status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
  const orders = all(query, params);
  const countQuery = 'SELECT COUNT(*) as cnt FROM orders' + (status ? ' WHERE order_status=?' : '');
  const total = get(countQuery, status ? [status] : []);
  res.json({ data: orders, total: total ? total.cnt : 0 });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = getOrderFull(req.params.id);
  if (!order) {
    const byNo = get('SELECT id FROM orders WHERE order_no = ?', [req.params.id]);
    if (byNo) return res.json({ data: getOrderFull(byNo.id) });
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ data: order });
});

// PATCH /api/orders/:id/status (admin)
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { order_status } = req.body;
  run('UPDATE orders SET order_status=? WHERE id=?', [order_status, req.params.id]);
  res.json({ success: true });
});

// PATCH /api/orders/:id/logistics (admin)
router.patch('/:id/logistics', authMiddleware, (req, res) => {
  const { logistics_no, logistics_company } = req.body;
  run("UPDATE orders SET logistics_no=?, logistics_company=?, order_status='shipped' WHERE id=?",
    [logistics_no, logistics_company, req.params.id]
  );
  res.json({ success: true });
});

function getOrderFull(id) {
  const order = get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return null;
  order.items = all('SELECT * FROM order_items WHERE order_id = ?', [id]);
  order.logistics_tracks = all('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY track_time DESC', [id]);
  return order;
}

module.exports = router;

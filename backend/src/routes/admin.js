const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = get('SELECT * FROM admins WHERE username = ?', [username]);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ data: { token, username: admin.username } });
});

// GET /api/admin/stats
router.get('/stats', authMiddleware, (req, res) => {
  const totalOrders = get('SELECT COUNT(*) as cnt FROM orders').cnt || 0;
  const pendingOrders = get("SELECT COUNT(*) as cnt FROM orders WHERE order_status='pending'").cnt || 0;
  const processingOrders = get("SELECT COUNT(*) as cnt FROM orders WHERE order_status='processing'").cnt || 0;
  const shippedOrders = get("SELECT COUNT(*) as cnt FROM orders WHERE order_status='shipped'").cnt || 0;
  const revenueRow = get("SELECT SUM(total_amount) as s FROM orders WHERE payment_status='paid'");
  const totalRevenue = (revenueRow && revenueRow.s) ? revenueRow.s : 0;
  const totalProducts = get('SELECT COUNT(*) as cnt FROM products').cnt || 0;
  res.json({ data: { totalOrders, pendingOrders, processingOrders, shippedOrders, totalRevenue, totalProducts } });
});

module.exports = router;

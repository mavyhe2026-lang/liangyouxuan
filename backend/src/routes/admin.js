const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { Admin, Order, Product } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const loginSchema = Joi.object({
  username: Joi.string().max(50).required(),
  password: Joi.string().max(100).required(),
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, error: error.details[0].message });

    const admin = await Admin.findOne({ where: { username: value.username } });
    if (!admin || !bcrypt.compareSync(value.password, admin.password)) {
      return res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ code: 0, data: { token, username: admin.username, expires_in: 86400 } });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/admin/stats（需认证）
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, processingOrders, shippedOrders, totalProducts] = await Promise.all([
      Order.count(),
      Order.count({ where: { order_status: 'pending' } }),
      Order.count({ where: { order_status: 'processing' } }),
      Order.count({ where: { order_status: 'shipped' } }),
      Product.count(),
    ]);

    const revenueResult = await Order.sum('total_amount', { where: { payment_status: 'paid' } });
    const totalRevenue = revenueResult || 0;

    res.json({ code: 0, data: { totalOrders, pendingOrders, processingOrders, shippedOrders, totalRevenue, totalProducts } });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// PUT /api/admin/password（修改密码）
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return res.status(400).json({ code: 400, error: '缺少参数' });
    if (new_password.length < 8) return res.status(400).json({ code: 400, error: '新密码至少8位' });

    const admin = await Admin.findByPk(req.admin.id);
    if (!bcrypt.compareSync(old_password, admin.password)) {
      return res.status(401).json({ code: 401, error: '旧密码错误' });
    }

    await admin.update({ password: bcrypt.hashSync(new_password, 10) });
    res.json({ code: 0, success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

module.exports = router;

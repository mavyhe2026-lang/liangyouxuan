const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Order, OrderItem, ProductVariant, Product, LogisticsTrack } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const orderSchema = Joi.object({
  user_name: Joi.string().max(100).required(),
  user_phone: Joi.string().max(20).required(),
  user_email: Joi.string().email().optional().allow('', null),
  address: Joi.string().max(500).required(),
  city: Joi.string().max(100).required(),
  province: Joi.string().max(100).required(),
  postal_code: Joi.string().max(20).optional().allow('', null),
  payment_method: Joi.string().valid('wechat', 'alipay').default('wechat'),
  note: Joi.string().max(500).optional().allow('', null),
  items: Joi.array().items(Joi.object({
    variant_id: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
  })).min(1).required(),
});

function generateOrderNo() {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  return 'ORD' + ts + Math.floor(Math.random()*1000).toString().padStart(3,'0');
}

// POST /api/orders - 创建订单
router.post('/', async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, error: error.details[0].message });

    const { items, ...orderData } = value;
    let total = 0;
    const enriched = [];

    for (const item of items) {
      const variant = await ProductVariant.findByPk(item.variant_id);
      if (!variant) return res.status(400).json({ code: 400, error: `规格不存在: ${item.variant_id}` });
      if (variant.stock < item.quantity) return res.status(400).json({ code: 400, error: `库存不足: ${variant.sku}` });
      const product = await Product.findByPk(variant.product_id);
      total += variant.price * item.quantity;
      enriched.push({ variant, product, quantity: item.quantity });
    }

    const order = await Order.create({ ...orderData, order_no: generateOrderNo(), total_amount: total });

    for (const { variant, product, quantity } of enriched) {
      await OrderItem.create({
        order_id: order.id, product_id: product.id, variant_id: variant.id,
        product_name: product.name_zh, spec: variant.spec, price: variant.price, quantity,
      });
      await ProductVariant.decrement('stock', { by: quantity, where: { id: variant.id } });
    }

    const result = await getOrderFull(order.id);
    res.status(201).json({ code: 0, data: result });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/orders（管理员）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.order_status = status;

    const { rows, count } = await Order.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ code: 0, data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    let order = await getOrderFull(req.params.id);
    if (!order) {
      const found = await Order.findOne({ where: { order_no: req.params.id } });
      if (found) order = await getOrderFull(found.id);
    }
    if (!order) return res.status(404).json({ code: 404, error: '订单不存在' });
    res.json({ code: 0, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// PATCH /api/orders/:id/status（管理员）
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { order_status } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(order_status)) return res.status(400).json({ code: 400, error: '无效状态' });
    await Order.update({ order_status }, { where: { id: req.params.id } });
    res.json({ code: 0, success: true });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

async function getOrderFull(id) {
  return Order.findByPk(id, {
    include: [
      { model: OrderItem, as: 'items' },
      { model: LogisticsTrack, as: 'logistics_tracks' },
    ],
  });
}

module.exports = router;

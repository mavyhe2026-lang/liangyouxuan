const express = require('express');
const router = express.Router();
const { Order } = require('../db');

// POST /api/payment/create
router.post('/create', async (req, res) => {
  try {
    const { order_id, payment_method } = req.body;
    if (!order_id) return res.status(400).json({ code: 400, error: '缺少 order_id' });

    const order = await Order.findByPk(order_id);
    if (!order) return res.status(404).json({ code: 404, error: '订单不存在' });

    const method = payment_method || order.payment_method || 'wechat';
    if (payment_method) await order.update({ payment_method });

    const paymentData = {
      order_id,
      order_no: order.order_no,
      amount: order.total_amount,
      payment_method: method,
      status: 'pending',
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${method}pay%3A%2F%2Fpay%3Forder%3D${order.order_no}`,
      qr_text: `${method === 'wechat' ? '微信' : '支付宝'}支付模拟码: ${order.order_no}`,
    };

    res.json({ code: 0, data: paymentData });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// POST /api/payment/simulate（演示用，生产环境应删除）
router.post('/simulate', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ code: 403, error: '生产环境不允许模拟支付' });
    }
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ code: 400, error: '缺少 order_id' });
    await Order.update(
      { payment_status: 'paid', payment_time: new Date(), order_status: 'processing' },
      { where: { id: order_id } }
    );
    res.json({ code: 0, success: true, message: '支付模拟成功' });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// POST /api/payment/notify（真实支付回调）
router.post('/notify', async (req, res) => {
  try {
    const { order_id, status } = req.body;
    // TODO: 验证签名
    if (status === 'success') {
      await Order.update(
        { payment_status: 'paid', payment_time: new Date(), order_status: 'processing' },
        { where: { id: order_id } }
      );
    } else {
      await Order.update({ payment_status: 'failed' }, { where: { id: order_id } });
    }
    res.json({ code: 0, success: true });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/payment/status/:order_id
router.get('/status/:order_id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.order_id, {
      attributes: ['id', 'order_no', 'payment_status', 'order_status', 'payment_method', 'total_amount'],
    });
    if (!order) return res.status(404).json({ code: 404, error: '订单不存在' });
    res.json({ code: 0, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

module.exports = router;

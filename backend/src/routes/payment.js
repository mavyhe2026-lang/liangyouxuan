const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');

// POST /api/payment/create
router.post('/create', (req, res) => {
  const { order_id, payment_method } = req.body;
  const order = get('SELECT * FROM orders WHERE id = ?', [order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const paymentData = {
    order_id,
    order_no: order.order_no,
    amount: order.total_amount,
    payment_method: payment_method || order.payment_method || 'wechat',
    status: 'pending',
  };

  if (paymentData.payment_method === 'wechat') {
    paymentData.qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=wxpay%3A%2F%2Fpay%3Forder%3D${order.order_no}`;
    paymentData.qr_text = `微信支付模拟码: ${order.order_no}`;
  } else {
    paymentData.qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=alipay%3A%2F%2Fpay%3Forder%3D${order.order_no}`;
    paymentData.qr_text = `支付宝支付模拟码: ${order.order_no}`;
  }

  if (payment_method) run('UPDATE orders SET payment_method=? WHERE id=?', [payment_method, order_id]);

  res.json({ data: paymentData });
});

// POST /api/payment/notify - real payment callback
router.post('/notify', (req, res) => {
  const { order_id, status } = req.body;
  if (status === 'success') {
    run("UPDATE orders SET payment_status='paid', payment_time=datetime('now'), order_status='processing' WHERE id=?", [order_id]);
  } else {
    run("UPDATE orders SET payment_status='failed' WHERE id=?", [order_id]);
  }
  res.json({ success: true });
});

// POST /api/payment/simulate - simulate payment success (demo only)
router.post('/simulate', (req, res) => {
  const { order_id } = req.body;
  run("UPDATE orders SET payment_status='paid', payment_time=datetime('now'), order_status='processing' WHERE id=?", [order_id]);
  res.json({ success: true, message: 'Payment simulated successfully' });
});

// GET /api/payment/status/:order_id
router.get('/status/:order_id', (req, res) => {
  const order = get('SELECT id, order_no, payment_status, order_status, payment_method FROM orders WHERE id = ?', [req.params.order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ data: order });
});

module.exports = router;

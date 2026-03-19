const express = require('express');
const router = express.Router();
const { Order, LogisticsTrack } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const MOCK_TRACKS = [
  { status: 'collected', description: '快件已揽收', location: '出发城市分拣中心' },
  { status: 'in_transit', description: '快件运输中，已到达转运中心', location: '中转城市转运中心' },
  { status: 'in_transit', description: '快件已从转运中心发出', location: '中转城市转运中心' },
  { status: 'in_transit', description: '快件已到达目的地城市', location: '目的地转运中心' },
  { status: 'delivering', description: '快件派送中，请保持电话畅通', location: '目的地配送站' },
  { status: 'delivered', description: '快件已签收，感谢使用京东物流', location: '目的地' },
];

// POST /api/logistics/create（管理员）
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ code: 400, error: '缺少 order_id' });

    const order = await Order.findByPk(order_id);
    if (!order) return res.status(404).json({ code: 404, error: '订单不存在' });

    const logistics_no = 'JD' + Date.now().toString().slice(-10) + Math.floor(Math.random()*1000).toString().padStart(3,'0');
    await order.update({ logistics_no, logistics_company: '京东物流', order_status: 'shipped' });
    await LogisticsTrack.create({
      order_id, logistics_no, status: 'collected',
      description: '商家已发货，等待京东物流揽收',
      location: (order.province || '') + (order.city || ''),
    });

    res.json({ code: 0, data: { logistics_no, company: '京东物流', order_id, message: '京东物流运单创建成功（模拟）' } });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// POST /api/logistics/sync/:order_id（管理员，模拟物流进度）
router.post('/sync/:order_id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.order_id);
    if (!order || !order.logistics_no) return res.status(400).json({ code: 400, error: '无物流信息' });

    const count = await LogisticsTrack.count({ where: { order_id: req.params.order_id } });
    if (count < MOCK_TRACKS.length) {
      const t = MOCK_TRACKS[count];
      await LogisticsTrack.create({ order_id: req.params.order_id, logistics_no: order.logistics_no, ...t });
      if (t.status === 'delivered') await order.update({ order_status: 'delivered' });
    }

    const tracks = await LogisticsTrack.findAll({
      where: { order_id: req.params.order_id },
      order: [['track_time', 'ASC']],
    });
    res.json({ code: 0, data: tracks, logistics_no: order.logistics_no, company: order.logistics_company });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/logistics/:order_id
router.get('/:order_id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.order_id, {
      attributes: ['id', 'order_no', 'logistics_no', 'logistics_company', 'order_status'],
    });
    if (!order) return res.status(404).json({ code: 404, error: '订单不存在' });
    const tracks = await LogisticsTrack.findAll({
      where: { order_id: req.params.order_id },
      order: [['track_time', 'DESC']],
    });
    res.json({ code: 0, data: { ...order.toJSON(), tracks } });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

module.exports = router;

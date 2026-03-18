const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const MOCK_TRACKS = [
  { status: 'collected', description: '快件已揽收', location: '出发城市分拣中心' },
  { status: 'in_transit', description: '快件运输中，已到达转运中心', location: '中转城市转运中心' },
  { status: 'in_transit', description: '快件已从转运中心发出', location: '中转城市转运中心' },
  { status: 'in_transit', description: '快件已到达目的地城市转运中心', location: '目的地转运中心' },
  { status: 'delivering', description: '快件派送中，请保持电话畅通', location: '目的地配送站' },
  { status: 'delivered', description: '快件已签收，感谢使用京东物流', location: '目的地' },
];

// POST /api/logistics/create
router.post('/create', authMiddleware, (req, res) => {
  const { order_id } = req.body;
  const order = get('SELECT * FROM orders WHERE id = ?', [order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const logisticsNo = 'JD' + Date.now().toString().slice(-10) + Math.floor(Math.random()*1000).toString().padStart(3,'0');
  const company = '京东物流';

  run("UPDATE orders SET logistics_no=?, logistics_company=?, order_status='shipped' WHERE id=?",
    [logisticsNo, company, order_id]
  );
  run(`INSERT INTO logistics_tracks (id, order_id, logistics_no, status, description, location) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), order_id, logisticsNo, 'collected', '商家已发货，等待京东物流揽收', (order.province || '') + (order.city || '')]
  );

  res.json({
    success: true,
    data: { logistics_no: logisticsNo, company, order_id, message: '京东物流运单创建成功（模拟）' }
  });
});

// POST /api/logistics/sync/:order_id
router.post('/sync/:order_id', authMiddleware, (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.order_id]);
  if (!order || !order.logistics_no) return res.status(400).json({ error: 'No logistics info' });

  const existingCount = get('SELECT COUNT(*) as cnt FROM logistics_tracks WHERE order_id = ?', [req.params.order_id]);
  const count = existingCount ? existingCount.cnt : 0;

  if (count < MOCK_TRACKS.length) {
    const t = MOCK_TRACKS[count];
    run(`INSERT INTO logistics_tracks (id, order_id, logistics_no, status, description, location) VALUES (?,?,?,?,?,?)`,
      [uuidv4(), req.params.order_id, order.logistics_no, t.status, t.description, t.location]
    );
    if (t.status === 'delivered') {
      run("UPDATE orders SET order_status='delivered' WHERE id=?", [req.params.order_id]);
    }
  }

  const tracks = all('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY track_time ASC', [req.params.order_id]);
  res.json({ data: tracks, logistics_no: order.logistics_no, company: order.logistics_company });
});

// GET /api/logistics/:order_id
router.get('/:order_id', (req, res) => {
  const order = get('SELECT id, order_no, logistics_no, logistics_company, order_status FROM orders WHERE id = ?', [req.params.order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const tracks = all('SELECT * FROM logistics_tracks WHERE order_id = ? ORDER BY track_time DESC', [req.params.order_id]);
  res.json({ data: { ...order, tracks } });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

// GET /api/products
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  else { query += " AND status = 'active'"; }
  query += ' ORDER BY created_at DESC';
  const products = all(query, params);
  const result = products.map(p => ({
    ...p,
    variants: all('SELECT * FROM product_variants WHERE product_id = ?', [p.id])
  }));
  res.json({ data: result });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  product.variants = all('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);
  res.json({ data: product });
});

// POST /api/products (admin)
router.post('/', authMiddleware, (req, res) => {
  const { name_zh, name_en, name_ko, description_zh, description_en, description_ko, category, image_url, variants } = req.body;
  const id = uuidv4();
  run(`INSERT INTO products (id, name_zh, name_en, name_ko, description_zh, description_en, description_ko, category, image_url) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, name_zh, name_en, name_ko, description_zh||'', description_en||'', description_ko||'', category, image_url||'']
  );
  if (variants && Array.isArray(variants)) {
    for (const v of variants) {
      run(`INSERT INTO product_variants (id, product_id, sku, spec, price, original_price, stock) VALUES (?,?,?,?,?,?,?)`,
        [uuidv4(), id, v.sku || `${category.toUpperCase()}-${v.spec}`, v.spec, v.price, v.original_price || null, v.stock || 0]
      );
    }
  }
  const product = get('SELECT * FROM products WHERE id = ?', [id]);
  product.variants = all('SELECT * FROM product_variants WHERE product_id = ?', [id]);
  res.status(201).json({ data: product });
});

// PUT /api/products/:id (admin)
router.put('/:id', authMiddleware, (req, res) => {
  const { name_zh, name_en, name_ko, description_zh, description_en, description_ko, category, image_url, status } = req.body;
  run(`UPDATE products SET name_zh=?, name_en=?, name_ko=?, description_zh=?, description_en=?, description_ko=?, category=?, image_url=?, status=? WHERE id=?`,
    [name_zh, name_en, name_ko, description_zh, description_en, description_ko, category, image_url, status, req.params.id]
  );
  const product = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Not found' });
  product.variants = all('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);
  res.json({ data: product });
});

// PATCH /api/products/:id/status (admin)
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  run('UPDATE products SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ success: true });
});

// PUT /api/products/variants/:variantId/stock (admin)
router.put('/variants/:variantId/stock', authMiddleware, (req, res) => {
  const { stock } = req.body;
  run('UPDATE product_variants SET stock=? WHERE id=?', [stock, req.params.variantId]);
  res.json({ success: true });
});

// DELETE /api/products/:id (admin)
router.delete('/:id', authMiddleware, (req, res) => {
  run('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
  run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;

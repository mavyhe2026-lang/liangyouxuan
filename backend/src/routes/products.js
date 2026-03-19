const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Product, ProductVariant } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const variantSchema = Joi.object({
  sku: Joi.string().optional(),
  spec: Joi.string().required(),
  price: Joi.number().integer().min(1).required(),
  original_price: Joi.number().integer().min(0).optional(),
  stock: Joi.number().integer().min(0).default(0),
});

const productSchema = Joi.object({
  name_zh: Joi.string().max(200).required(),
  name_en: Joi.string().max(200).required(),
  name_ko: Joi.string().max(200).required(),
  description_zh: Joi.string().optional().allow(''),
  description_en: Joi.string().optional().allow(''),
  description_ko: Joi.string().optional().allow(''),
  category: Joi.string().valid('rice', 'dates', 'other').required(),
  image_url: Joi.string().uri().optional().allow(''),
  variants: Joi.array().items(variantSchema).optional(),
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const where = {};
    if (category) where.category = category;
    where.status = status || 'active';

    const products = await Product.findAll({
      where,
      include: [{ model: ProductVariant, as: 'variants' }],
      order: [['created_at', 'DESC']],
    });
    res.json({ code: 0, data: products });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductVariant, as: 'variants' }],
    });
    if (!product) return res.status(404).json({ code: 404, error: '产品不存在' });
    res.json({ code: 0, data: product });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// POST /api/products（管理员）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, error: error.details[0].message });

    const { variants, ...productData } = value;
    const product = await Product.create(productData);

    if (variants?.length) {
      for (const v of variants) {
        await ProductVariant.create({
          ...v,
          product_id: product.id,
          sku: v.sku || `${productData.category.toUpperCase()}-${v.spec}`,
        });
      }
    }

    const result = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }],
    });
    res.status(201).json({ code: 0, data: result });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// PUT /api/products/:id（管理员）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ code: 404, error: '产品不存在' });
    await product.update(req.body);
    const result = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }],
    });
    res.json({ code: 0, data: result });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// PATCH /api/products/:id/status（管理员）
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ code: 400, error: '无效的状态值' });
    }
    await Product.update({ status }, { where: { id: req.params.id } });
    res.json({ code: 0, success: true });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// DELETE /api/products/:id（管理员）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ProductVariant.destroy({ where: { product_id: req.params.id } });
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ code: 0, success: true });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

module.exports = router;

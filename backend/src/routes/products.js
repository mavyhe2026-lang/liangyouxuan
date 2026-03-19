const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Product, ProductVariant, Category } = require('../db');
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
  category_id: Joi.string().uuid().optional().allow(null, ''),
  image_url: Joi.string().uri().optional().allow(''),
  variants: Joi.array().items(variantSchema).optional(),
});

// GET /api/products
// 支持过滤参数：category（一级分类slug）、category_id（二级分类ID）、status
router.get('/', async (req, res) => {
  try {
    const { category, category_id, slug, status } = req.query;
    const where = {};
    where.status = status || 'active';

    // 按一级分类过滤（兼容旧字段）
    if (category) where.category = category;

    // 按二级分类 ID 过滤
    if (category_id) where.category_id = category_id;

    // 按分类 slug 过滤（自动解析到 category_id）
    if (slug) {
      const cat = await Category.findOne({ where: { slug } });
      if (cat) {
        // 如果是一级分类，获取所有子分类的产品
        if (!cat.parent_id) {
          const children = await Category.findAll({ where: { parent_id: cat.id } });
          const childIds = children.map(c => c.id);
          if (childIds.length > 0) {
            const { Op } = require('sequelize');
            where.category_id = { [Op.in]: childIds };
          } else {
            where.category = cat.slug;
          }
        } else {
          where.category_id = cat.id;
        }
      }
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: ProductVariant, as: 'variants' },
        { model: Category, as: 'category_info', required: false },
      ],
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
      include: [
        { model: ProductVariant, as: 'variants' },
        { model: Category, as: 'category_info', required: false },
      ],
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

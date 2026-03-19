const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Category, Product } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const categorySchema = Joi.object({
  name_zh: Joi.string().max(100).required(),
  name_en: Joi.string().max(100).required(),
  name_ko: Joi.string().max(100).required(),
  slug: Joi.string().max(100).pattern(/^[a-z0-9-]+$/).required(),
  parent_id: Joi.string().uuid().optional().allow(null, ''),
  sort_order: Joi.number().integer().default(0),
  icon: Joi.string().max(10).optional().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

// GET /api/categories - 获取完整分类树
router.get('/', async (req, res) => {
  try {
    // 只查一级分类，带上二级子分类
    const categories = await Category.findAll({
      where: { parent_id: null, status: 'active' },
      include: [{
        model: Category,
        as: 'children',
        where: { status: 'active' },
        required: false,
        order: [['sort_order', 'ASC']],
      }],
      order: [['sort_order', 'ASC']],
    });
    res.json({ code: 0, data: categories });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/categories/all - 获取所有分类（含非激活，管理员用）
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        model: Category,
        as: 'children',
        required: false,
        order: [['sort_order', 'ASC']],
      }],
      where: { parent_id: null },
      order: [['sort_order', 'ASC']],
    });
    res.json({ code: 0, data: categories });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// GET /api/categories/:slug - 根据 slug 获取分类及其产品
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug },
      include: [{
        model: Category,
        as: 'children',
        where: { status: 'active' },
        required: false,
      }, {
        model: Category,
        as: 'parent',
        required: false,
      }],
    });
    if (!category) return res.status(404).json({ code: 404, error: '分类不存在' });
    res.json({ code: 0, data: category });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// POST /api/categories - 新增分类（管理员）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, error: error.details[0].message });

    // 检查 slug 是否重复
    const exists = await Category.findOne({ where: { slug: value.slug } });
    if (exists) return res.status(400).json({ code: 400, error: 'slug 已存在' });

    // 如果有 parent_id，验证父分类存在且是一级分类
    if (value.parent_id) {
      const parent = await Category.findByPk(value.parent_id);
      if (!parent) return res.status(400).json({ code: 400, error: '父分类不存在' });
      if (parent.parent_id) return res.status(400).json({ code: 400, error: '最多支持两级分类' });
    }

    const category = await Category.create(value);
    res.status(201).json({ code: 0, data: category });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// PUT /api/categories/:id - 更新分类（管理员）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ code: 404, error: '分类不存在' });

    const allowed = ['name_zh', 'name_en', 'name_ko', 'icon', 'sort_order', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await category.update(updates);
    res.json({ code: 0, data: category });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

// DELETE /api/categories/:id - 删除分类（管理员）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ code: 404, error: '分类不存在' });

    // 检查是否有子分类
    const childCount = await Category.count({ where: { parent_id: req.params.id } });
    if (childCount > 0) return res.status(400).json({ code: 400, error: '请先删除子分类' });

    // 检查是否有产品
    const productCount = await Product.count({ where: { category_id: req.params.id } });
    if (productCount > 0) return res.status(400).json({ code: 400, error: `该分类下有 ${productCount} 个产品，请先移除` });

    await category.destroy();
    res.json({ code: 0, success: true });
  } catch (err) {
    res.status(500).json({ code: 500, error: err.message });
  }
});

module.exports = router;

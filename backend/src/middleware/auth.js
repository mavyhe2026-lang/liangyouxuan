const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, error: '未授权，请先登录' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, error: 'Token 已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, error: '无效的 Token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };

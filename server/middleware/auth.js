import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'batuan-voting-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, lrn: user.lrn },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const [rows] = await pool.query('SELECT id, lrn, full_name, must_change_password FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const [roles] = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [req.user.id, 'admin']
    );
    if (roles.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.isAdmin = true;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

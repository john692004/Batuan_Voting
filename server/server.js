import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import pool from './db.js';
import { generateToken, requireAuth, requireAdmin } from './middleware/auth.js';

// Multer config for candidate photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only .jpg, .jpeg, .png, and .webp files are allowed'));
  },
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ─── Auth Routes ────────────────────────────────────────────────

// Login with LRN (students) or username (admin)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { lrn, password } = req.body;
    if (!lrn || !password) {
      return res.status(400).json({ error: 'LRN and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE lrn = ?', [lrn]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid LRN or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid LRN or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, lrn: user.lrn, full_name: user.full_name },
      must_change_password: !!user.must_change_password,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change password (for forced password change on first login)
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      [password_hash, req.user.id]
    );

    // Generate a new token
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const token = generateToken(rows[0]);

    res.json({ success: true, token });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const [profiles] = await pool.query(
      'SELECT full_name, has_voted, grade_level, section FROM profiles WHERE user_id = ?',
      [req.user.id]
    );
    const [roles] = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [req.user.id]
    );

    const profile = profiles[0] || null;
    const isAdmin = roles.some(r => r.role === 'admin');

    res.json({
      user: { id: req.user.id, lrn: req.user.lrn, full_name: req.user.full_name },
      profile,
      isAdmin,
      must_change_password: !!req.user.must_change_password,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// ─── Voter Management (Admin only) ─────────────────────────────

// List all voters
app.get('/api/voters', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.lrn, u.full_name, u.must_change_password, u.created_at,
             p.grade_level, p.section, p.has_voted
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'voter'
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('List voters error:', err);
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
});

// Add a new voter
app.post('/api/voters', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { lrn, full_name, grade_level, section } = req.body;
    if (!lrn || !full_name) {
      return res.status(400).json({ error: 'LRN and full name are required' });
    }

    // Check if LRN already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE lrn = ?', [lrn]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'LRN already registered' });
    }

    const id = uuidv4();
    // Default password = LRN
    const password_hash = await bcrypt.hash(lrn, 10);

    await pool.query(
      'INSERT INTO users (id, lrn, password_hash, full_name, must_change_password) VALUES (?, ?, ?, ?, 1)',
      [id, lrn, password_hash, full_name]
    );

    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, user_id, full_name, grade_level, section) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), id, full_name, grade_level || null, section || null]
    );

    // Assign voter role
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), id, 'voter']
    );

    res.json({ id, lrn, full_name, grade_level, section });
  } catch (err) {
    console.error('Add voter error:', err);
    res.status(500).json({ error: 'Failed to add voter' });
  }
});

// Update voter info
app.put('/api/voters/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { lrn, full_name, grade_level, section } = req.body;
    if (!lrn || !full_name) {
      return res.status(400).json({ error: 'LRN and full name are required' });
    }

    // Check for duplicate LRN (excluding current user)
    const [existing] = await pool.query('SELECT id FROM users WHERE lrn = ? AND id != ?', [lrn, req.params.id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'LRN already in use by another account' });
    }

    await pool.query(
      'UPDATE users SET lrn = ?, full_name = ? WHERE id = ?',
      [lrn, full_name, req.params.id]
    );

    await pool.query(
      'UPDATE profiles SET full_name = ?, grade_level = ?, section = ? WHERE user_id = ?',
      [full_name, grade_level || null, section || null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update voter error:', err);
    res.status(500).json({ error: 'Failed to update voter' });
  }
});

// Delete a voter
app.delete('/api/voters/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // This cascades to profiles, user_roles, and votes due to FK constraints
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete voter error:', err);
    res.status(500).json({ error: 'Failed to delete voter' });
  }
});

// Reset voter password back to LRN
app.post('/api/voters/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lrn FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    const password_hash = await bcrypt.hash(rows[0].lrn, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
      [password_hash, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── Positions ──────────────────────────────────────────────────

app.get('/api/positions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM positions ORDER BY display_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// ─── Candidates ─────────────────────────────────────────────────

app.get('/api/candidates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM candidates');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', requireAuth, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, position_id, grade_level, section, party_list, motto } = req.body;
    if (!name || !position_id || !grade_level || !section || !party_list) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const id = uuidv4();
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
    await pool.query(
      'INSERT INTO candidates (id, name, position_id, grade_level, section, party_list, motto, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, position_id, grade_level, section, party_list, motto || null, avatar_url]
    );

    res.json({ id, name, position_id, grade_level, section, party_list, motto, avatar_url });
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/api/candidates/:id', requireAuth, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, position_id, grade_level, section, party_list, motto } = req.body;
    if (!name || !position_id || !grade_level || !section || !party_list) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let avatar_url = undefined;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    const fields = ['name = ?', 'position_id = ?', 'grade_level = ?', 'section = ?', 'party_list = ?', 'motto = ?'];
    const values = [name, position_id, grade_level, section, party_list, motto || null];

    if (avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(avatar_url);
    }

    values.push(req.params.id);
    await pool.query(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

app.delete('/api/candidates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ─── Votes ──────────────────────────────────────────────────────

app.post('/api/votes', requireAuth, async (req, res) => {
  try {
    const { votes } = req.body;
    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: 'No votes provided' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const vote of votes) {
        const id = uuidv4();
        await connection.query(
          'INSERT INTO votes (id, voter_id, candidate_id, position_id) VALUES (?, ?, ?, ?)',
          [id, req.user.id, vote.candidate_id, vote.position_id]
        );
      }

      // Mark profile as voted
      await connection.query(
        'UPDATE profiles SET has_voted = 1 WHERE user_id = ?',
        [req.user.id]
      );

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'You have already voted for this position' });
      }
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit votes' });
  }
});

app.get('/api/votes/counts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vote_counts ORDER BY display_order, vote_count DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vote counts' });
  }
});

// ─── Election Settings ──────────────────────────────────────────

app.get('/api/election-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM election_settings LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch election settings' });
  }
});

app.put('/api/election-settings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    await pool.query(
      'UPDATE election_settings SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update election settings' });
  }
});

// ─── Stats ──────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const [[{ voterCount }]] = await pool.query(
      "SELECT COUNT(*) as voterCount FROM profiles p INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'voter'"
    );
    const [[{ votedCount }]] = await pool.query(
      "SELECT COUNT(*) as votedCount FROM profiles p INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'voter' WHERE p.has_voted = 1"
    );
    const [[{ totalVotes }]] = await pool.query('SELECT COUNT(*) as totalVotes FROM votes');
    const [[{ positionCount }]] = await pool.query('SELECT COUNT(*) as positionCount FROM positions');

    res.json({ voterCount, votedCount, totalVotes, positionCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Start ──────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Batuan Voting API server running on http://localhost:${PORT}`);
});

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [id, email, password_hash, full_name]
    );

    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, user_id, full_name) VALUES (?, ?, ?)',
      [uuidv4(), id, full_name]
    );

    // Assign voter role
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), id, 'voter']
    );

    const token = generateToken({ id, email });
    res.json({ token, user: { id, email, full_name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
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
      user: req.user,
      profile,
      isAdmin,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
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
    const [[{ voterCount }]] = await pool.query('SELECT COUNT(*) as voterCount FROM profiles');
    const [[{ votedCount }]] = await pool.query('SELECT COUNT(*) as votedCount FROM profiles WHERE has_voted = 1');
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

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

// Default classroom positions (used when setting up a section election)
const DEFAULT_CLASSROOM_POSITIONS = [
  { title: 'Mayor', display_order: 1 },
  { title: 'Vice Mayor', display_order: 2 },
  { title: 'Secretary', display_order: 3 },
  { title: 'Treasurer', display_order: 4 },
  { title: 'Auditor', display_order: 5 },
  { title: 'P.I.O.', display_order: 6 },
  { title: 'Peace Officer', display_order: 7 },
];

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
      'SELECT full_name, has_voted_sslg, has_voted_classroom, grade_level, section FROM profiles WHERE user_id = ?',
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
             p.grade_level, p.section, p.has_voted_sslg, p.has_voted_classroom
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
    if (!/^\d{12}$/.test(lrn)) {
      return res.status(400).json({ error: 'LRN must be exactly 12 digits (numbers only)' });
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
    if (!/^\d{12}$/.test(lrn)) {
      return res.status(400).json({ error: 'LRN must be exactly 12 digits (numbers only)' });
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
    const { type, section } = req.query;
    let sql = 'SELECT * FROM positions';
    const params = [];

    if (type === 'classroom' && section) {
      sql += ' WHERE election_type = ? AND section = ?';
      params.push('classroom', section);
    } else if (type === 'classroom') {
      sql += ' WHERE election_type = ?';
      params.push('classroom');
    } else {
      // Default: SSLG positions
      sql += ' WHERE election_type = ?';
      params.push(type || 'sslg');
    }

    sql += ' ORDER BY display_order';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Create a position (admin)
app.post('/api/positions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, display_order, election_type, section } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO positions (id, title, display_order, election_type, section) VALUES (?, ?, ?, ?, ?)',
      [id, title, display_order || 0, election_type || 'sslg', section || null]
    );

    res.json({ id, title, display_order, election_type, section });
  } catch (err) {
    console.error('Add position error:', err);
    res.status(500).json({ error: 'Failed to add position' });
  }
});

// Delete a position (admin)
app.delete('/api/positions/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

// ─── Candidates ─────────────────────────────────────────────────

app.get('/api/candidates', async (req, res) => {
  try {
    const { type, section } = req.query;
    let sql = 'SELECT * FROM candidates';
    const params = [];

    if (type === 'classroom' && section) {
      sql += ' WHERE election_type = ? AND section = ?';
      params.push('classroom', section);
    } else if (type === 'classroom') {
      sql += ' WHERE election_type = ?';
      params.push('classroom');
    } else {
      sql += ' WHERE election_type = ?';
      params.push(type || 'sslg');
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', requireAuth, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, position_id, grade_level, section, party_list, motto, election_type } = req.body;
    const eType = election_type || 'sslg';
    if (!name || !position_id || !grade_level || !section) {
      return res.status(400).json({ error: 'Name, position, grade level, and section are required' });
    }
    if (eType === 'sslg' && !party_list) {
      return res.status(400).json({ error: 'Party list is required for SSLG elections' });
    }

    const id = uuidv4();
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
    await pool.query(
      'INSERT INTO candidates (id, name, position_id, grade_level, section, party_list, motto, avatar_url, election_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, position_id, grade_level, section, party_list || '', motto || null, avatar_url, eType]
    );

    res.json({ id, name, position_id, grade_level, section, party_list: party_list || '', motto, avatar_url, election_type: eType });
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/api/candidates/:id', requireAuth, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, position_id, grade_level, section, party_list, motto, election_type } = req.body;
    const eType = election_type || 'sslg';
    if (!name || !position_id || !grade_level || !section) {
      return res.status(400).json({ error: 'Name, position, grade level, and section are required' });
    }
    if (eType === 'sslg' && !party_list) {
      return res.status(400).json({ error: 'Party list is required for SSLG elections' });
    }

    let avatar_url = undefined;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    const fields = ['name = ?', 'position_id = ?', 'grade_level = ?', 'section = ?', 'party_list = ?', 'motto = ?', 'election_type = ?'];
    const values = [name, position_id, grade_level, section, party_list || '', motto || null, eType];

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
    const { votes, election_type } = req.body;
    const eType = election_type || 'sslg';

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: 'No votes provided' });
    }

    // For classroom elections, validate that voter's section matches
    if (eType === 'classroom') {
      const [profiles] = await pool.query('SELECT section FROM profiles WHERE user_id = ?', [req.user.id]);
      if (!profiles[0]?.section) {
        return res.status(400).json({ error: 'You must have a section assigned to vote in classroom elections' });
      }

      // Verify all candidates belong to the same section as the voter
      const voterSection = profiles[0].section;
      for (const vote of votes) {
        const [cands] = await pool.query('SELECT section, election_type FROM candidates WHERE id = ?', [vote.candidate_id]);
        if (cands.length === 0) {
          return res.status(400).json({ error: 'Invalid candidate' });
        }
        if (cands[0].election_type !== 'classroom' || cands[0].section !== voterSection) {
          return res.status(403).json({ error: 'You can only vote for candidates in your own section' });
        }
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const vote of votes) {
        const id = uuidv4();
        await connection.query(
          'INSERT INTO votes (id, voter_id, candidate_id, position_id, election_type) VALUES (?, ?, ?, ?, ?)',
          [id, req.user.id, vote.candidate_id, vote.position_id, eType]
        );
      }

      // Mark profile as voted for the appropriate election type
      const votedColumn = eType === 'classroom' ? 'has_voted_classroom' : 'has_voted_sslg';
      await connection.query(
        `UPDATE profiles SET ${votedColumn} = 1 WHERE user_id = ?`,
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
    const { type, section } = req.query;
    let sql = 'SELECT * FROM vote_counts';
    const params = [];

    if (type === 'classroom' && section) {
      sql += ' WHERE election_type = ? AND section = ?';
      params.push('classroom', section);
    } else {
      sql += ' WHERE election_type = ?';
      params.push(type || 'sslg');
    }

    sql += ' ORDER BY display_order, vote_count DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vote counts' });
  }
});

// ─── Election Settings ──────────────────────────────────────────

app.get('/api/election-settings', async (req, res) => {
  try {
    const { type, section } = req.query;

    if (type === 'classroom' && section) {
      const [rows] = await pool.query(
        'SELECT * FROM election_settings WHERE election_type = ? AND section = ? LIMIT 1',
        ['classroom', section]
      );
      res.json(rows[0] || null);
    } else {
      const [rows] = await pool.query(
        'SELECT * FROM election_settings WHERE election_type = ? LIMIT 1',
        [type || 'sslg']
      );
      res.json(rows[0] || null);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch election settings' });
  }
});

app.put('/api/election-settings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, name, school_year, election_date, voting_start, voting_end } = req.body;

    const fields = [];
    const values = [];

    if (status)        { fields.push('status = ?');        values.push(status); }
    if (name)          { fields.push('name = ?');          values.push(name); }
    if (school_year)   { fields.push('school_year = ?');   values.push(school_year); }
    if (election_date) { fields.push('election_date = ?'); values.push(election_date); }
    if (voting_start)  { fields.push('voting_start = ?');  values.push(voting_start); }
    if (voting_end)    { fields.push('voting_end = ?');    values.push(voting_end); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE election_settings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update election settings' });
  }
});

// ─── Classroom Management (Admin only) ──────────────────────────

// List all distinct sections from voter profiles
app.get('/api/classroom/sections', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT section FROM profiles WHERE section IS NOT NULL AND section != '' ORDER BY section"
    );
    res.json(rows.map(r => r.section));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Set up a classroom election for a section (creates default positions + election settings)
app.post('/api/classroom/setup', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { section } = req.body;
    if (!section) return res.status(400).json({ error: 'Section is required' });

    // Check if this section already has classroom positions
    const [existing] = await pool.query(
      'SELECT id FROM positions WHERE election_type = ? AND section = ? LIMIT 1',
      ['classroom', section]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Classroom election already set up for this section' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create default positions for this section
      for (const pos of DEFAULT_CLASSROOM_POSITIONS) {
        await connection.query(
          'INSERT INTO positions (id, title, display_order, election_type, section) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), pos.title, pos.display_order, 'classroom', section]
        );
      }

      // Create election settings for this section
      await connection.query(
        'INSERT INTO election_settings (id, name, school_year, election_date, status, election_type, section) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), `Classroom Officers — ${section}`, '2025-2026', '2026-03-15', 'upcoming', 'classroom', section]
      );

      await connection.commit();
      res.json({ success: true, message: `Classroom election set up for ${section}` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Setup classroom error:', err);
    res.status(500).json({ error: err.message || 'Failed to set up classroom election' });
  }
});

// List all classroom elections (sections with their settings)
app.get('/api/classroom/elections', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM election_settings WHERE election_type = 'classroom' ORDER BY section"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classroom elections' });
  }
});

// ─── Stats ──────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const { type, section } = req.query;
    const eType = type || 'sslg';

    const votedCol = eType === 'classroom' ? 'has_voted_classroom' : 'has_voted_sslg';

    let voterFilter = "INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'voter'";
    let votedFilter = voterFilter;
    const voterParams = [];
    const votedParams = [];

    if (eType === 'classroom' && section) {
      voterFilter += ' WHERE p.section = ?';
      voterParams.push(section);
      votedFilter += ` WHERE p.${votedCol} = 1 AND p.section = ?`;
      votedParams.push(section);
    } else if (eType === 'classroom') {
      votedFilter += ` WHERE p.${votedCol} = 1`;
    } else {
      votedFilter += ` WHERE p.${votedCol} = 1`;
    }

    const [[{ voterCount }]] = await pool.query(
      `SELECT COUNT(*) as voterCount FROM profiles p ${voterFilter}`,
      voterParams
    );
    const [[{ votedCount }]] = await pool.query(
      `SELECT COUNT(*) as votedCount FROM profiles p ${votedFilter}`,
      votedParams
    );

    // Total votes for this election type
    let votesSql = "SELECT COUNT(*) as totalVotes FROM votes WHERE election_type = ?";
    const votesParams = [eType];
    if (eType === 'classroom' && section) {
      // Get position IDs for this section, then count votes for those positions
      votesSql = `SELECT COUNT(*) as totalVotes FROM votes v
        INNER JOIN positions p ON p.id = v.position_id
        WHERE v.election_type = ? AND p.section = ?`;
      votesParams.push(section);
    }
    const [[{ totalVotes }]] = await pool.query(votesSql, votesParams);

    // Position count
    let posSql = "SELECT COUNT(*) as positionCount FROM positions WHERE election_type = ?";
    const posParams = [eType];
    if (eType === 'classroom' && section) {
      posSql += ' AND section = ?';
      posParams.push(section);
    }
    const [[{ positionCount }]] = await pool.query(posSql, posParams);

    res.json({ voterCount, votedCount, totalVotes, positionCount });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Auto-End Scheduler ─────────────────────────────────────────
// Runs every 60 seconds. Automatically marks 'ongoing' elections as
// 'completed' once the current date+time has passed election_date + voting_end.

async function autoEndElections() {
  try {
    // Get all currently ongoing elections
    const [ongoing] = await pool.query(
      "SELECT id, name, election_date, voting_end FROM election_settings WHERE status = 'ongoing'"
    );

    const now = new Date();

    for (const election of ongoing) {
      // Build the end datetime by combining election_date and voting_end
      const dateStr = election.election_date instanceof Date
        ? election.election_date.toISOString().slice(0, 10)
        : String(election.election_date).slice(0, 10);

      const endDateTime = new Date(`${dateStr}T${election.voting_end}`);

      if (now >= endDateTime) {
        await pool.query(
          "UPDATE election_settings SET status = 'completed' WHERE id = ?",
          [election.id]
        );
        console.log(`[Auto-End] Election "${election.name}" (${election.id}) automatically completed at ${now.toLocaleString()}.`);
      }
    }
  } catch (err) {
    console.error('[Auto-End] Scheduler error:', err.message);
  }
}

// Run immediately on startup, then every 60 seconds
autoEndElections();
setInterval(autoEndElections, 60 * 1000);

// ─── Start ──────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Batuan Voting API server running on http://localhost:${PORT}`);
  console.log('[Auto-End] Election auto-end scheduler is active (checks every 60s).');
});

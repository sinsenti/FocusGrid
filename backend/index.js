import express from 'express';
import cors from 'cors';
import pool from './db.js';


const app = express();
app.use(cors());
app.use(express.json());

// Add new entry
app.post('/api/add', async (req, res) => {
  const { category, minutes, description, timestamp } = req.body;
  const ts = timestamp ? new Date(timestamp) : new Date();
  await pool.query(
    'INSERT INTO time_entry (category, minutes, description, timestamp) VALUES ($1,$2,$3,$4)',
    [category, minutes, description, ts]
  );
  res.json({ success: true });
});

// List all entries, newest first
app.get('/api/entries', async (req, res) => {
  const result = await pool.query('SELECT * FROM time_entry ORDER BY timestamp DESC');
  res.json(result.rows);
});

// Stats: week/month
app.get('/api/stats', async (req, res) => {
  const now = new Date();
  const week_start = new Date(now);
  week_start.setDate(now.getDate() - now.getDay());
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1);

  const entries = (await pool.query('SELECT * FROM time_entry')).rows;
  const stats = { week: {}, month: {} };
  entries.forEach(entry => {
    const ts = new Date(entry.timestamp);
    if (ts >= week_start)
      stats.week[entry.category] = (stats.week[entry.category] || 0) + entry.minutes;
    if (ts >= month_start)
      stats.month[entry.category] = (stats.month[entry.category] || 0) + entry.minutes;
  });
  res.json(stats);
});

// Update entry
app.put('/api/update/:id', async (req, res) => {
  const { category, minutes, description } = req.body;
  await pool.query(
    'UPDATE time_entry SET category=$1, minutes=$2, description=$3 WHERE id=$4',
    [category, minutes, description, req.params.id]
  );
  res.json({ success: true });
});

// Filter entries by search string, newest first
app.get('/api/entries_filter', async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let result;
  if (!q) {
    result = await pool.query('SELECT * FROM time_entry ORDER BY timestamp DESC');
  } else {
    result = await pool.query(
      "SELECT * FROM time_entry WHERE LOWER(category) LIKE $1 OR LOWER(description) LIKE $1 ORDER BY timestamp DESC",
      [`%${q}%`]
    );
  }
  res.json(result.rows);
});

// Delete all entries
app.post('/api/delete_all', async (req, res) => {
  const result = await pool.query('DELETE FROM time_entry');
  res.json({ success: true, deleted: result.rowCount });
});

// Health check (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(5000, () => console.log('Node backend started on port 5000'));


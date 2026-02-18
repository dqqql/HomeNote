
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const db = new sqlite3.Database(path.join(dataDir, 'homenote.db'));

db.serialize(function() {
  db.run('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, role TEXT, color TEXT DEFAULT "", is_private INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS note_images (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER, image_path TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (note_id) REFERENCES notes (id))');
});

const storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, uploadsDir); },
  filename: function(req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

app.get('/api/notes', function(req, res) {
  const role = req.query.role;
  const search = req.query.search;
  let sql = 'SELECT * FROM notes WHERE is_private = 0';
  let params = [];

  if (search) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%');
  }

  sql += ' ORDER BY updated_at DESC';

  db.all(sql, params, function(err, rows) {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.get('/api/notes/private', function(req, res) {
  const role = req.query.role;
  db.all('SELECT * FROM notes WHERE is_private = 1 AND role = ? ORDER BY updated_at DESC', [role], function(err, rows) {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.get('/api/notes/:id', function(req, res) {
  db.get('SELECT * FROM notes WHERE id = ?', [req.params.id], function(err, row) {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).json({ error: 'Note not found' });
    else res.json(row);
  });
});

app.get('/api/notes/:id/images', function(req, res) {
  db.all('SELECT * FROM note_images WHERE note_id = ?', [req.params.id], function(err, rows) {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post('/api/notes', function(req, res) {
  const title = req.body.title || '';
  const content = req.body.content || '';
  const role = req.body.role || '';
  let color = req.body.color;
  if (color === undefined || color === null) color = '';
  const is_private = req.body.is_private ? 1 : 0;
  
  console.log('创建便签 - 颜色:', color, 'is_private:', is_private);
  db.run('INSERT INTO notes (title, content, role, color, is_private) VALUES (?, ?, ?, ?, ?)', [title, content, role, color, is_private], function(err) {
    if (err) {
      console.error('创建便签错误:', err.message);
      res.status(500).json({ error: err.message });
    }
    else {
      console.log('便签创建成功，ID:', this.lastID);
      res.json({ id: this.lastID });
    }
  });
});

app.post('/api/notes/:id/images', upload.single('image'), function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  db.run('INSERT INTO note_images (note_id, image_path) VALUES (?, ?)', [req.params.id, req.file.filename], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ id: this.lastID, image_path: req.file.filename });
  });
});

app.put('/api/notes/:id', function(req, res) {
  const title = req.body.title || '';
  const content = req.body.content || '';
  let color = req.body.color;
  if (color === undefined || color === null) color = '';
  const is_private = req.body.is_private ? 1 : 0;
  
  console.log('更新便签 - ID:', req.params.id, '颜色:', color, 'is_private:', is_private);
  db.run('UPDATE notes SET title = ?, content = ?, color = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, content, color, is_private, req.params.id], function(err) {
    if (err) {
      console.error('更新便签错误:', err.message);
      res.status(500).json({ error: err.message });
    }
    else {
      console.log('便签更新成功');
      res.json({ success: true });
    }
  });
});

app.delete('/api/notes/:id', function(req, res) {
  db.run('DELETE FROM notes WHERE id = ?', [req.params.id], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else {
      db.all('SELECT image_path FROM note_images WHERE note_id = ?', [req.params.id], function(err, rows) {
        if (rows) {
          rows.forEach(function(row) {
            const filePath = path.join(uploadsDir, row.image_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          });
        }
        db.run('DELETE FROM note_images WHERE note_id = ?', [req.params.id]);
      });
      res.json({ success: true });
    }
  });
});

app.get('/uploads/:filename', function(req, res) {
  res.sendFile(path.join(uploadsDir, req.params.filename));
});

app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});


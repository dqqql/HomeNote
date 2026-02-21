
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
  db.run('CREATE TABLE IF NOT EXISTS role_passwords (role TEXT PRIMARY KEY, password_hash TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS login_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP, ip TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER, role TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (note_id) REFERENCES notes (id))');
  db.run('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, content TEXT, role TEXT, color TEXT DEFAULT "", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  initSystemSettings();
});

function initSystemSettings() {
  db.get('SELECT * FROM system_settings WHERE key = ?', ['master_password_hash'], function(err, row) {
    if (!row) {
      const defaultMasterPassword = 'FamilyNote2026!';
      const hashedPassword = hashPassword(defaultMasterPassword);
      db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['master_password_hash', hashedPassword]);
    }
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === newHash;
}

function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, reason: '密码长度至少需要8位字符' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, reason: '密码必须同时包含字母和数字' };
  }
  return { valid: true };
}

function getMasterPasswordHash(callback) {
  db.get('SELECT value FROM system_settings WHERE key = ?', ['master_password_hash'], function(err, row) {
    if (err || !row) {
      callback(null);
    } else {
      callback(row.value);
    }
  });
}

function checkLoginLock(role, callback) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  db.all('SELECT * FROM login_attempts WHERE role = ? AND attempt_time > ?', [role, tenMinutesAgo], function(err, rows) {
    if (rows && rows.length >= 5) {
      callback(true, 10 - Math.floor((Date.now() - new Date(rows[0].attempt_time).getTime()) / 60000));
    } else {
      callback(false, 0);
    }
  });
}

function recordLoginAttempt(role, ip) {
  db.run('INSERT INTO login_attempts (role, ip) VALUES (?, ?)', [role, ip || 'unknown']);
}

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

app.get('/api/roles/:role/has-password', function(req, res) {
  const role = req.params.role;
  db.get('SELECT * FROM role_passwords WHERE role = ?', [role], function(err, row) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ hasPassword: !!row });
  });
});

app.post('/api/roles/:role/set-password', function(req, res) {
  const role = req.params.role;
  const password = req.body.password;
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }
  const hashedPassword = hashPassword(password);
  db.run('REPLACE INTO role_passwords (role, password_hash, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [role, hashedPassword], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

app.post('/api/roles/:role/verify-password', function(req, res) {
  const role = req.params.role;
  const password = req.body.password;
  const ip = req.ip || req.connection.remoteAddress;
  
  checkLoginLock(role, function(isLocked, remainingMinutes) {
    if (isLocked) {
      return res.status(429).json({ 
        error: '尝试次数过多，请' + remainingMinutes + '分钟后再试', 
        locked: true 
      });
    }
    
    db.get('SELECT * FROM role_passwords WHERE role = ?', [role], function(err, row) {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '该角色尚未设置密码' });
      
      getMasterPasswordHash(function(masterHash) {
        let isValid = false;
        
        if (verifyPassword(password, row.password_hash)) {
          isValid = true;
        } else if (masterHash && verifyPassword(password, masterHash)) {
          isValid = true;
        }
        
        if (isValid) {
          res.json({ valid: true });
        } else {
          recordLoginAttempt(role, ip);
          res.json({ valid: false, error: '密码错误' });
        }
      });
    });
  });
});

app.post('/api/roles/:role/change-password', function(req, res) {
  const role = req.params.role;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const ip = req.ip || req.connection.remoteAddress;
  
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }
  
  checkLoginLock(role, function(isLocked, remainingMinutes) {
    if (isLocked) {
      return res.status(429).json({ 
        error: '尝试次数过多，请' + remainingMinutes + '分钟后再试', 
        locked: true 
      });
    }
    
    db.get('SELECT * FROM role_passwords WHERE role = ?', [role], function(err, row) {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '该角色尚未设置密码' });
      
      getMasterPasswordHash(function(masterHash) {
        let isValid = false;
        
        if (verifyPassword(oldPassword, row.password_hash)) {
          isValid = true;
        } else if (masterHash && verifyPassword(oldPassword, masterHash)) {
          isValid = true;
        }
        
        if (!isValid) {
          recordLoginAttempt(role, ip);
          return res.json({ success: false, error: '原密码错误' });
        }
        
        const newHashedPassword = hashPassword(newPassword);
        db.run('UPDATE role_passwords SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE role = ?', [newHashedPassword, role], function(err) {
          if (err) res.status(500).json({ error: err.message });
          else res.json({ success: true });
        });
      });
    });
  });
});

app.get('/api/notes/:id/comments', function(req, res) {
  db.all('SELECT * FROM comments WHERE note_id = ? ORDER BY created_at ASC', [req.params.id], function(err, rows) {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post('/api/notes/:id/comments', function(req, res) {
  const role = req.body.role || '';
  const content = req.body.content || '';
  
  if (!content.trim()) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }
  
  db.run('INSERT INTO comments (note_id, role, content) VALUES (?, ?, ?)', [req.params.id, role, content], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ id: this.lastID });
  });
});

app.delete('/api/comments/:id', function(req, res) {
  db.run('DELETE FROM comments WHERE id = ?', [req.params.id], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

app.get('/api/todos', function(req, res) {
  const date = req.query.date;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  let sql = 'SELECT * FROM todos';
  let params = [];

  if (date) {
    sql += ' WHERE date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    sql += ' WHERE date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }

  sql += ' ORDER BY date ASC, created_at ASC';

  db.all(sql, params, function(err, rows) {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.get('/api/todos/:id', function(req, res) {
  db.get('SELECT * FROM todos WHERE id = ?', [req.params.id], function(err, row) {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).json({ error: 'Todo not found' });
    else res.json(row);
  });
});

app.post('/api/todos', function(req, res) {
  const date = req.body.date || '';
  const content = req.body.content || '';
  const role = req.body.role || '';
  let color = req.body.color;
  if (color === undefined || color === null) color = '';

  db.run('INSERT INTO todos (date, content, role, color) VALUES (?, ?, ?, ?)', [date, content, role, color], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put('/api/todos/:id', function(req, res) {
  const content = req.body.content || '';
  let color = req.body.color;
  if (color === undefined || color === null) color = '';

  db.run('UPDATE todos SET content = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, color, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.delete('/api/todos/:id', function(req, res) {
  db.run('DELETE FROM todos WHERE id = ?', [req.params.id], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});

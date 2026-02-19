
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'homenote.db'));

console.log('Checking database structure...');
db.all("PRAGMA table_info(notes)", function(err, rows) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('notes table columns:');
    rows.forEach(function(row) {
      console.log(row);
    });
  }
  db.close();
});


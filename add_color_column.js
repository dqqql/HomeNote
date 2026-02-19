
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'homenote.db'));

console.log('Adding color column to notes table...');
db.run('ALTER TABLE notes ADD COLUMN color TEXT DEFAULT ""', function(err) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Successfully added color column!');
  }
  db.close();
});


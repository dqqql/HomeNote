
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'homenote.db'));

console.log('Fixing database...');
db.run('UPDATE notes SET color = "" WHERE color IS NULL OR color = "undefined"', function(err) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Fixed ' + this.changes + ' notes');
  }
  db.close();
});


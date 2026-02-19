
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'homenote.db'));

console.log('Checking notes in database:');
db.all('SELECT * FROM notes', function(err, rows) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Found ' + rows.length + ' notes:');
    rows.forEach(function(row) {
      console.log('ID: ' + row.id + ', Title: ' + row.title + ', Color: "' + row.color + ' (type: ' + typeof row.color + ')');
    });
  }
  db.close();
});


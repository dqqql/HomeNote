
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'homenote.db');
const db = new sqlite3.Database(dbPath);

db.serialize(function() {
  console.log('正在清理密码数据...');
  
  db.run('DELETE FROM role_passwords', function(err) {
    if (err) {
      console.error('清理 role_passwords 表失败:', err);
    } else {
      console.log('✅ 已清理 role_passwords 表');
    }
  });
  
  db.run('DELETE FROM login_attempts', function(err) {
    if (err) {
      console.error('清理 login_attempts 表失败:', err);
    } else {
      console.log('✅ 已清理 login_attempts 表');
    }
  });
  
  console.log('\n密码数据已清理完成！系统已恢复到初始状态。');
  console.log('\n注意：万能密码仍然保持不变，默认密码是 "FamilyNote2026!"');
  
  db.close();
});

const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Database schema is ready.');
  await db.pool.end();
})().catch((e) => {
  console.error('DB init failed:', e.message);
  process.exit(1);
});

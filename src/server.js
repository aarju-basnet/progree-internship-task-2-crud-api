require('dotenv').config();
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;

if (!process.env.API_KEY) {
  console.error('API_KEY is not set. Copy .env.example to .env and set it.');
  process.exit(1);
}

db.query('SELECT 1')
  .then(() => {
    console.log('Connected to PostgreSQL');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('Cannot connect to database:', e.message);
    process.exit(1);
  });

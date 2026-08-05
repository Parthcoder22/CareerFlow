require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function fix() {
  const hash = await bcrypt.hash('Admin@123', 12);
  await db.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@careerflow.com']);
  console.log('Fixed DB');
  
  const fs = require('fs');
  let sql = fs.readFileSync('./database/seed.sql', 'utf8');
  sql = sql.replace(/\$2a\$12\$LQv3c1yqBo9SkvXS7QTJp\.KHdF4qVGjkYvP1VPqxG6xH3lJAqzCmi/g, hash);
  fs.writeFileSync('./database/seed.sql', sql);
  console.log('Fixed seed.sql');
  process.exit(0);
}
fix().catch(console.error);

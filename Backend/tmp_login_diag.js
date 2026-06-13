const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'mysql123', database: 'hawker' });
  const pairs = [
    ['inspector@hawker.com', 'Inspector123!'],
    ['citycorp@hawker.com', 'CityCorp123!']
  ];
  for (const [email, password] of pairs) {
    const [rows] = await conn.execute('SELECT id,email,role,account_status,is_email_verified,password_hash FROM users WHERE email=?', [email]);
    if (!rows.length) {
      console.log(email, 'MISSING');
      continue;
    }
    const u = rows[0];
    const b = await bcrypt.compare(password, u.password_hash || '').catch(() => false);
    const p = (u.password_hash || '') === password;
    console.log(JSON.stringify({ email: u.email, role: u.role, status: u.account_status, verified: u.is_email_verified, bcrypt: b, plain: p }));
  }
  await conn.end();
})();

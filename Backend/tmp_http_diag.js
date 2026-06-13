const mysql=require('mysql2/promise');
const bcrypt=require('bcryptjs');
const http=require('http');
(async()=>{
  const email='inspector@hawker.com';
  const password='Inspector123!';
  console.log('pw_len', password.length, 'pw_json', JSON.stringify(password));
  const c=await mysql.createConnection({host:'localhost',user:'root',password:'mysql123',database:'hawker'});
  const [rows]=await c.execute('SELECT password_hash FROM users WHERE email=?',[email]);
  console.log('hash_prefix', (rows[0].password_hash||'').slice(0,4));
  console.log('bcrypt_compare', await bcrypt.compare(password, rows[0].password_hash));
  await c.end();

  const body=JSON.stringify({email,password});
  console.log('body', body);
  const req=http.request('http://localhost:8080/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{console.log('status',res.statusCode);console.log('resp',d);});});
  req.on('error',e=>console.error('err',e.message));
  req.write(body); req.end();
})();

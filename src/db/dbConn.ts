import { Client } from 'pg';

const dbConn = new Client({
  user: 'roo', // User 이름
  host: '152.70.95.89',
  database: 'blog', // DB 이름
  password: '1', // 임시 비밀번호
  port: 5432,
});

export default dbConn;

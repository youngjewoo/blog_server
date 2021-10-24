// Server.ts
import express from 'express';
import { Client } from 'pg';

const roo = new Client({
  user: 'roo', // User 이름
  database: 'blog', // DB 이름
  password: '1', // 임시 비밀번호
});

roo.connect();

roo.query('SELECT * FROM pg_catalog.pg_tables;', (err, res) => {
  console.log(res);
  roo.end();
});

class Server {
  // app 타입 지정
  public app: express.Application;

  // 생성자
  constructor() {
    this.app = express();

    this.app.get('/', function (req, res) {
      res.send('Hello 스터D');
    });
  }
}

const server = new Server().app;

server.set('port', 3000); // 포트지정 바로 listen으로 지정해도 상관없음

server
  .listen(server.get('port'), () => {
    console.log(`${server.get('port')} server is Running`);
  })
  .on('error', err => {
    console.log(`Error message ${err}`);
  });

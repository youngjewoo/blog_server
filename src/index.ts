// Server.ts
import express from 'express';
import userApi from './router/userApi';
import postApi from './router/postApi';
import loginApi from './router/loginApi';
import cors from 'cors';

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
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors()); //모든 cross-origin 요청에 대해 응답
server.use(userApi);
server.use(postApi);
server.use(loginApi);

server
  .listen(server.get('port'), () => {
    console.log(`${server.get('port')} server is Running`);
  })
  .on('error', err => {
    console.log(`Error message ${err}`);
  });

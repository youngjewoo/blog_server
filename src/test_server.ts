// test_server.ts
import express from 'express';
import userApi from './router/userApi';
import postApi from './router/postApi';
import postLikeApi from './router/postLikeApi';
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
server.set('port', 8888); // 테스트용 포트
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors()); //모든 cross-origin 요청에 대해 응답
server.use(userApi);
server.use(postApi);
server.use(postLikeApi);
server.use(loginApi);

export default server;

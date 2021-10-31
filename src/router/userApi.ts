import express from 'express';
import { Client } from 'pg';

interface UserInfoDTO {
  user_id: number;
  user_name: string;
  velog_name: string;
  social_info?: string;
  email_addr?: string;
  email_info?: string;
}

const router = express.Router();
const temp: UserInfoDTO[] = [
  {
    user_id: 1,
    user_name: 'youngje',
    velog_name: 'youngje_woo',
    social_info: '',
    email_addr: '',
    email_info: '',
  },
  {
    user_id: 2,
    user_name: 'chaemin',
    velog_name: 'coolchaem',
    social_info: '',
    email_addr: '',
    email_info: '',
  },
  {
    user_id: 3,
    user_name: 'yeojin',
    velog_name: 'yeogenius',
    social_info: '',
    email_addr: '',
    email_info: '',
  },
];
const roo = new Client({
  user: 'roo', // User 이름
  host: '192.168.11.60',
  database: 'blog', // DB 이름
  password: '1', // 임시 비밀번호
  port: 5432,
});

roo.connect();

// 사용자 목록
router.get('/users', (req, res) => {
  // 이 쿼리가 왜 안 되지..?
  // DB와 gui 툴 간의 싱크가 맞지 않는 거 같다...ㅠ
  // roo.query('SELECT * FROM pg_catalog.pg_tables', (err, res) => {
  //   console.log(res);
  //   roo.end();
  // });
  return res.json(temp);
});

// id에 해당하는 사용자 리턴
router.get('/users/:id', (req, res) => {
  // id가 Nullish 값인 경우
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ err: 'Incorrect id!' });
  }
  // id에 해당하는 사용자가 없는 경우
  const user = temp.filter(user => user.user_id === id);
  if (user.length === 0) {
    return res.status(404).json({ err: 'Unknown user' });
  }

  return res.json(user[0]);
});

// id에 해당하는 사용자 삭제
router.delete('/users/:id', (req, res) => {
  // id가 Nullish 값인 경우
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ err: 'Incorrect id!' });
  }
  // id에 해당하는 사용자가 없는 경우
  const idx = temp.findIndex(user => user.user_id === id);
  if (idx === -1) {
    return res.status(404).json({ err: 'Unknown user' });
  }

  temp.splice(idx, 1);
  res.status(204).send();
});

// 사용자 추가
router.post('/users', (req, res) => {
  const name = req.body.name || '';

  if (name.length === 0) {
    return res.status(400).json({ err: 'Incorrect name!' });
  }
  const newId =
    temp.reduce((maxId, user) => {
      return user.user_id > maxId ? user.user_id : maxId;
    }, 0) + 1;

  // 새로운 유저 정의
  const newUser = {
    user_id: newId,
    user_name: name,
    velog_name: '',
  };
  temp.push(newUser);

  return res.status(201).json(newUser);
});

export default router;

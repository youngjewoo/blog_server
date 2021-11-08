import express from 'express';
import { Client } from 'pg';

const router = express.Router();
const roo = new Client({
  user: 'roo', // User 이름
  host: '192.168.11.60',
  database: 'blog', // DB 이름
  password: '1', // 임시 비밀번호
  port: 5432,
});

roo.connect();

// 사용자 목록
router.get('/users', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  roo.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    return response.json(result.rows);
  });
});

// id에 해당하는 사용자 리턴
router.get('/users/:id', (req, response) => {
  // id가 Nullish 값인 경우
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }
  // id가 유효한 경우
  roo.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    const user = users.filter(user => user.user_id === id);
    // id에 해당하는 사용자가 없는 경우
    if (user.length === 0) {
      return response.status(404).json({ err: 'Unknown user' });
    }
    return response.json(user[0]);
  });
});

// id에 해당하는 사용자 삭제
router.delete('/users/:id', (req, response) => {
  // id가 Nullish 값인 경우
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }
  // id가 유효한 경우
  roo.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;

    // id에 해당하는 사용자가 없는 경우
    const idx = users.findIndex(user => user.user_id === id);
    if (idx === -1) {
      return response.status(404).json({ err: `Unknown user ${id}`, log: users });
    }

    const deleteQuery = `DELETE FROM public."BLOG_USERS"
    WHERE user_id IN
    (${id});`;

    // Delete 쿼리는 응답이 없나..?
    roo.query(deleteQuery, (err, result) => {
      response.status(204).send(`User ${id} DELETED`);
    });
  });
});

// 사용자 추가
router.post('/users', (req, response) => {
  roo.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;

    // 새로운 user id 발급
    const newId =
      users.reduce((maxId, user) => {
        return user.user_id > maxId ? user.user_id : maxId;
      }, 1) + 1;

    // column name 스트링 생성 (req.body에 대한 validation 필요할 수도)
    const targetColStr = ['user_id', ...Object.getOwnPropertyNames(req.body)]
      .filter(prop => prop !== '')
      .join(',');
    // column value 스트링 생성
    const newUserInfoStr = [newId, ...Object.values(req.body).map(val => `'${val}'`)]
      .filter(prop => prop !== '')
      .join(',');
    // 새로운 유저 생성 쿼리
    const insertQuery = `INSERT INTO public."BLOG_USERS" (${targetColStr}) 
      VALUES (${newUserInfoStr}) returning user_id;`;

    roo.query(insertQuery, (err, result) => {
      console.log(err);
      return response.status(201).json(`User ${newId} created`);
    });
  });
});

// 사용자 정보 업데이트
router.put('/users/:id', (req, response) => {
  // id가 Nullish 값인 경우
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }

  roo.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    // id에 해당하는 사용자가 없는 경우
    const idx = users.findIndex(user => user.user_id === id);
    if (idx === -1) {
      return response.status(404).json({ err: 'Unknown user' });
    }

    // set 스트링 생성
    const setStr = Object.entries(req.body).map(e => `${e[0]} = '${e[1]}'`);

    // 새로운 유저 생성 쿼리
    const updateQuery = `UPDATE public."BLOG_USERS" SET ${setStr} WHERE user_id = ${id};`;
    console.log(updateQuery);

    roo.query(updateQuery, (err, result) => {
      return response.status(201).json(`User ${id} updated`);
    });
  });
});

export default router;

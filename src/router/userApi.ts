import express from 'express';
import dbConn from '../db/dbConn';
import { v4 } from 'uuid';

const router = express.Router();

// 사용자 목록
router.get('/users', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    return response.json(result.rows);
  });
});

// id에 해당하는 사용자 리턴
router.get('/users/:user_name', (req, response) => {
  // id가 Nullish 값인 경우
  const targetUserName = req.params.user_name;
  if (!targetUserName) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }
  // id가 유효한 경우
  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    const user = users.filter(user => user.user_name === targetUserName);
    // id에 해당하는 사용자가 없는 경우
    if (user.length === 0) {
      return response.status(404).json({ err: 'Unknown user' });
    }
    return response.json(user[0]);
  });
});

// id에 해당하는 사용자 삭제
router.delete('/users/:user_name', (req, response) => {
  // id가 Nullish 값인 경우
  const targetUserName = req.params.user_name;
  if (!targetUserName) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }
  // id가 유효한 경우
  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;

    // id에 해당하는 사용자가 없는 경우
    const idx = users.findIndex(user => user.user_name === targetUserName);
    if (idx === -1) {
      return response.status(404).json({ err: `Unknown user ${targetUserName}`, log: users });
    }

    const deleteQuery = `DELETE FROM public."BLOG_USERS"
    WHERE user_name IN
    (${targetUserName});`;

    // Delete 쿼리는 응답이 없나..?
    dbConn.query(deleteQuery, (err, result) => {
      response.status(204).send(`User ${targetUserName} DELETED`);
    });
  });
});

// 사용자 추가
router.post('/users', (req, response) => {
  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    const newUserName = req.body.user_name;
    // 중복 체크
    if(!newUserName || users.findIndex(user => user.user_name === newUserName) > -1) {
      return response.status(400).json('Need user name');
    }

    // column name 스트링 생성 (req.body에 대한 validation 필요할 수도)
    const targetColStr = [...Object.getOwnPropertyNames(req.body)]
      .filter(prop => prop !== '')
      .join(',');
    // column value 스트링 생성
    const newUserInfoStr = [...Object.values(req.body).map(val => `'${val}'`)]
      .filter(prop => prop !== '')
      .join(',');
    // 새로운 유저 생성 쿼리
    const insertQuery = `INSERT INTO public."BLOG_USERS" (${targetColStr}) 
      VALUES (${newUserInfoStr}) returning user_name;`;

    dbConn.query(insertQuery, (err, result) => {
      console.log(err);
      return response.status(201).json(`User ${newUserName} created`);
    });
  });
});

// 사용자 정보 업데이트
router.put('/users/:user_name', (req, response) => {
  // id가 Nullish 값인 경우
  const userName = req.params.user_name;
  if (!userName) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }

  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    // id에 해당하는 사용자가 없는 경우
    const idx = users.findIndex(user => user.user_name === userName);
    if (idx === -1) {
      return response.status(404).json({ err: 'Unknown user' });
    }

    // set 스트링 생성
    const setStr = Object.entries(req.body).map(e => `${e[0]} = '${e[1]}'`);

    // 새로운 유저 생성 쿼리
    const updateQuery = `UPDATE public."BLOG_USERS" SET ${setStr} WHERE user_name = ${userName};`;
    console.log(updateQuery);

    dbConn.query(updateQuery, (err, result) => {
      return response.status(201).json(`User ${userName} updated`);
    });
  });
});

export default router;

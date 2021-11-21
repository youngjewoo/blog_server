import express from 'express';
import dbConn from '../db/dbConn';

const router = express.Router();

// 사용자 목록
router.get('/posts', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  dbConn.query('SELECT * FROM public."BLOG_POSTS"', (err, result) => {
    return response.json(result.rows);
  });
});

// 사용자 포스팅 GET
router.get('/@:username', (req, response) => {
    const userName = req.params.username;
  
    // 사용자 이름이 넘어오지 않은 경우
    if (userName === undefined || userName === ''){
      return response.status(201).json(`Unkown user ${userName}`);
    }
  
    // 사용자 이름과 일치하는 포스팅 데이터
    dbConn.query(`SELECT * FROM public."BLOG_POSTS"
    JOIN public."BLOG_USERS" 
    ON public."BLOG_USERS".user_id = public."BLOG_POSTS".fk_user_id
    WHERE velog_name='${userName}'`, 
    (err, result) => {
      const users = result.rows;
      response.status(200).json(users);
    });
  });
  

export default router;
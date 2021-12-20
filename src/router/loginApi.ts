import express from 'express';
import dbConn from '../db/dbConn';

const router = express.Router();

// TODO oauth ? v2? 적용 예정(authapi)
// login 정보 받아서 확인
router.post('/login', (req, response) => {
  console.log(req.body);
  if (!req.body.email_addr) {
    return response.status(400).json({ err: 'Incorrect id!' });
  }
  // if (!req.body.password) {
  //   return response.status(400).json({ err: 'Password is required!' });
  // }

  dbConn.query('SELECT * FROM public."BLOG_USERS"', (err, result) => {
    const users = result.rows;
    const user = users.filter(user => user.email_addr === req.body.email_addr);
    if (user.length === 0) {
      return response.status(404).json({ err: 'Username or Password is invalid' });
    }
    return response.json(user[0]);
  });
});

export default router;

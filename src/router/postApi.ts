import express from 'express';
import { v4 } from 'uuid';
import dbConn from '../db/dbConn';
import { createUrlSlug, genSubSlug } from '../utils/slugUtil';

const router = express.Router();

// 사용자 목록
router.get('/posts', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  dbConn.query(`SELECT * FROM public."BLOG_POSTS" ORDER BY released_at DESC;`, (err, result) => {
    return response.json(result.rows);
  });
});

router.get('/recentPosts/:loadPostCount', async (req, response) => {
  const { loadPostCount } = req.params;
  const postsQueryResult = await dbConn.query(
    `SELECT * FROM public."BLOG_POSTS" ORDER BY released_at DESC LIMIT 15 OFFSET ${
      +loadPostCount * 15
    };`
  );

  const posts = postsQueryResult.rows;
  const postsWithUser = posts.map(post => {
    return (post = {
      ...post,
      user: {
        id: post.user_id,
        username: post.user_name,
      },
    });
  });
  return response.json(postsWithUser);
});

// 사용자 포스팅 모두 GET
router.get('/@:username', (req, response) => {
  const userName = req.params.username;

  // 사용자 이름이 넘어오지 않은 경우
  if (userName === undefined || userName === '') {
    return response.status(201).json(`Unkown user ${userName}`);
  }

  // 사용자 이름과 일치하는 포스팅 데이터
  dbConn.query(
    `SELECT * FROM public."BLOG_POSTS" WHERE fk_user_name='${userName}'
    ORDER BY released_at DESC;`,
    (err, result) => {
      const users = result.rows;
      response.status(200).json(users);
    }
  );
});

// 사용자의 특정 포스팅 GET (by slug)
router.get('/@:username/:url_slug', (req, response) => {
  const userName = req.params.username;
  const slug = req.params.url_slug;
  console.log(slug);

  // 사용자 이름이 넘어오지 않은 경우
  if (userName === undefined || userName === '') {
    return response.status(201).json(`Unkown user ${userName}`);
  }

  // 사용자 이름과 일치하는 포스팅 데이터
  dbConn.query(
    `SELECT * FROM public."BLOG_POSTS" WHERE (fk_user_name='${userName}' AND url_slug='${slug}')`,
    (err, result) => {
      if (result.rows.length === 0) {
        return response.status(404).json({ err: 'Post Not Found' });
      }
      const post = result.rows[0];
      response.setHeader('Cache-Control', 'private, no-cache');
      if (req.headers['if-modified-since'] === new Date(post.released_at).toUTCString()) {
        return response.status(304).send();
      }
      response.setHeader('Last-Modified', new Date(post.released_at).toUTCString());
      return response.status(200).json(post);
    }
  );
});

// 사용자 포스팅 CREATE
router.post('/write', (req, response) => {
  req.body.url_slug = createUrlSlug(req.body.title);
  dbConn.query('SELECT * FROM public."BLOG_POSTS"', (err, result) => {
    const posts = result.rows;
    const newId = v4();

    // Slug의 중복 여부 체크 - 같은 유저끼리만 중복 검사하자
    if (posts.some(post => post.url_slug === req.body.url_slug)) {
      req.body.url_slug = `${req.body.url_slug}-${genSubSlug()}`;
    }

    // column name 스트링 생성 (req.body에 대한 validation 필요할 수도)
    const targetColStr = ['id', ...Object.getOwnPropertyNames(req.body), 'released_at']
      .filter(prop => prop !== '')
      .join(',');

    // column value 스트링 생성
    const newPostInfoStr = [
      newId,
      ...Object.values(req.body).map(val => `'${val}'`),
      `'${new Date().toISOString()}'`,
    ]
      .filter(prop => prop !== '')
      .join(',');

    // 새로운 포스팅 생성 쿼리
    const insertQuery = `INSERT INTO public."BLOG_POSTS" (${targetColStr}) 
      VALUES (${newPostInfoStr}) 
      returning id;`;

    dbConn.query(insertQuery, (err, result) => {
      if (err) {
        response.status(400).json(err);
      }
      return response.status(201).json(`Post ${newId} created`);
    });
  });
});

export default router;

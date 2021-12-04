import { create } from 'domain';
import express from 'express';
import dbConn from '../db/dbConn';
import { createUrlSlug, genSubSlug } from '../utils/slugUtil';

const router = express.Router();

// 사용자 목록
router.get('/posts', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  dbConn.query(
    `SELECT * FROM public."BLOG_POSTS"
  JOIN public."BLOG_USERS" 
  ON public."BLOG_USERS".user_id = public."BLOG_POSTS".fk_user_id
  ORDER BY released_at DESC;`,
    (err, result) => {
      return response.json(result.rows);
    }
  );
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
    `SELECT * FROM public."BLOG_POSTS"
    JOIN public."BLOG_USERS" 
    ON public."BLOG_USERS".user_id = public."BLOG_POSTS".fk_user_id
    WHERE velog_name='${userName}'
    ORDER BY released_at DESC;`,
    (err, result) => {
      const users = result.rows;
      response.status(200).json(users);
    }
  );
});

// 사용자의 특정 포스팅 GET (by title)
// router.get('/@:username/:title', (req, response) => {
//   const userName = req.params.username;
//   const title = req.params.title;
//   console.log(title);

//   // 사용자 이름이 넘어오지 않은 경우
//   if (userName === undefined || userName === '') {
//     return response.status(201).json(`Unkown user ${userName}`);
//   }

//   // 사용자 이름과 일치하는 포스팅 데이터
//   dbConn.query(
//     `SELECT * FROM public."BLOG_POSTS"
//     JOIN public."BLOG_USERS"
//     ON public."BLOG_USERS".user_id = public."BLOG_POSTS".fk_user_id
//     WHERE (velog_name='${userName}' AND title='${title}')`,
//     (err, result) => {
//       const users = result.rows;
//       response.status(200).json(users);
//     }
//   );
// });

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
    `SELECT * FROM public."BLOG_POSTS"
    JOIN public."BLOG_USERS"
    ON public."BLOG_USERS".user_id = public."BLOG_POSTS".fk_user_id
    WHERE (velog_name='${userName}' AND url_slug='${slug}')`,
    (err, result) => {
      const users = result.rows;
      response.status(200).json(users);
    }
  );
});

// 사용자 포스팅 CREATE
router.post('/write', (req, response) => {
  req.body.url_slug = createUrlSlug(req.body.title);
  dbConn.query('SELECT * FROM public."BLOG_POSTS"', (err, result) => {
    const posts = result.rows;

    // 새로운 포스팅 id 발급 (DB 함수로 max id를 얻어올 수도 있을 거 같음 성능 비교 후 바꾸자)
    const newId =
      posts.reduce((maxId, post) => {
        return Number(post.id) > maxId ? Number(post.id) : maxId;
      }, 0) + 1;

    // Slug의 중복 여부 체크
    if (posts.some(post => post.url_slug === req.body.url_slug)) {
      req.body.url_slug = `${req.body.url_slug}-${genSubSlug()}`;
    }
    console.log(req.body.url_slug);
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

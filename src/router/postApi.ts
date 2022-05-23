import etag from 'etag';
import express from 'express';
import { v4, validate } from 'uuid';
import dbConn from '../db/dbConn';
import { SinglePost } from '../types/Post';
import { User } from '../types/User';
import { createUrlSlug, genSubSlug } from '../utils/slugUtil';
import { isLikedPost } from './postLikeApi';

const router = express.Router();
const getDBColName = (propName: string) => {
  switch (propName) {
    case 'id': // uuid
    case 'title': // text
    case 'body':
    case 'short_description':
    case 'thumbnail':
    case 'temp_post_id':
    case 'url_slug':
    case 'is_markdown': // boolean
    case 'is_temp':
    case 'is_private':
    case 'released_at': // timestamp
    case 'likes': // integer
    case 'views':
      return propName;
    case 'user': // json
      return 'fk_user_name';
    default:
      return '';
  }
};

const getDBTypeString = (propName: string) => {
  let typeString = '';
  switch (propName) {
    case 'id': // uuid
      typeString = 'uuid';
      break;
    case 'title': // text
    case 'body':
    case 'short_description':
    case 'thumbnail':
    case 'temp_post_id':
    case 'url_slug':
      typeString = 'text';
      break;
    case 'is_markdown': // boolean
    case 'is_temp':
    case 'is_private':
      typeString = 'boolean';
      break;
    case 'released_at': // timestamp
      typeString = 'timestamp with time zone';
      break;
    case 'likes': // integer
    case 'views':
      typeString = 'integer';
      break;
    case 'user': // json
      typeString = 'text';
    default:
      break;
  }
  return typeString;
};
const getDBValueString = (propName: string, propVal: string | number | boolean | User) => {
  let valueString = '';
  switch (propName) {
    case 'id': // uuid
    case 'title': // text
    case 'body':
    case 'short_description':
    case 'thumbnail':
    case 'temp_post_id':
    case 'url_slug':
      valueString = propVal as string;
      break;
    case 'released_at': // timestamp
      valueString = new Date().toISOString();
      break;
    case 'is_markdown': // boolean
    case 'is_temp':
    case 'is_private':
      valueString = (propVal as boolean) ? 'true' : 'false';
      break;
    case 'likes': // integer
    case 'views':
      valueString = (propVal as number).toString();
      break;
    case 'user': // json
      valueString = (propVal as User).username;
      break;
    default:
      return '';
  }
  return `'${valueString}'::${getDBTypeString(propName)}`;
};

// 사용자 목록
// type: Post
router.get('/posts', (req, response) => {
  // 테이블 이름에 "" 반드시 붙여줘야함..
  dbConn.query(
    `SELECT p.id, p.title, p.body, p.thumbnail, p.is_markdown, p.is_temp, p.url_slug, p.meta, 
            p.is_private, p.released_at, p.likes, p.views, p.short_description,
            json_build_object(
              'username', u.user_name, 
              'email', u.email_addr, 
              'is_certified', u.is_certified) as user
              FROM public."BLOG_POSTS" as p
              JOIN public."BLOG_USERS" as u
              ON p.fk_user_name = u.user_name 
                ORDER BY released_at DESC;`,
    (err, result) => {
      return response.json(result.rows);
    }
  );
});

// type: PartialPost
router.get('/recentPosts/:loadPostCount', async (req, response) => {
  const { loadPostCount } = req.params;
  const postsQueryResult = await dbConn.query(
    `SELECT p.id, p.title, p.short_description, p.thumbnail, p.url_slug, 
            p.is_private, p.released_at, p.likes, 
            json_build_object(
              'username', u.user_name, 
              'email', u.email_addr, 
              'is_certified', u.is_certified) as user
            FROM public."BLOG_POSTS" as p
                JOIN public."BLOG_USERS" as u 
                ON p.fk_user_name = u.user_name
                  ORDER BY released_at DESC LIMIT 15 OFFSET ${+loadPostCount * 15};`
  );
  return response.json(postsQueryResult.rows);
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

// type: SinglePost
// 사용자의 특정 포스팅 GET (by slug)
router.get('/@:username/:url_slug/', async (req, response) => {
  const userName = req.params.username;
  const slug = req.params.url_slug;

  // 사용자 이름이 넘어오지 않은 경우
  if (userName === undefined || userName === '') {
    return response.status(201).json(`Unkown user ${userName}`);
  }

  try {
    // 사용자 이름과 일치하는 포스팅 데이터 (post <-left join- user)
    const result = await dbConn.query(
      `SELECT p.id, p.title, p.released_at, p.body, p.short_description, 
      p.is_markdown, p.is_private, p.thumbnail, p.url_slug, 
      json_build_object(
        'username', u.user_name, 
        'email', u.email_addr, 
        'is_certified', u.is_certified) as user,
      p.likes, false as liked
        FROM public."BLOG_POSTS" as p
        LEFT JOIN public."BLOG_USERS" as u
        ON p.fk_user_name=u.user_name
          WHERE (p.fk_user_name='${userName}' AND p.url_slug='${slug}')`
    );
    if (result.rows.length === 0) {
      return response.status(404).json({ err: 'Post Not Found' });
    }
    const post = result.rows[0];
    let etagHashKey = '' + post.id + post.body + post.likes;
    const loginUserName = req.query.loginUserName;
    if (loginUserName?.length && typeof loginUserName === 'string') {
      try {
        post.liked = await isLikedPost(loginUserName, post.id);
      } catch (err) {
        post.liked = false;
      }
      etagHashKey += post.liked;
    }

    response.setHeader('Cache-Control', 'private, no-cache');
    if (
      req.headers['if-none-match'] === etag(etagHashKey) &&
      req.headers['if-modified-since'] === new Date(post.released_at).toUTCString()
    ) {
      return response.status(304).send();
    }
    response.setHeader('ETag', etag(etagHashKey));
    response.setHeader('Last-Modified', new Date(post.released_at).toUTCString());

    return response.status(200).json(post);
  } catch (err) {
    return response.status(404).json({ err: 'Post Not Found' });
  }
});

const createPostQuery = async (postInfo: SinglePost) => {
  let newSlug = createUrlSlug(postInfo.title);
  console.log(postInfo);
  const userName = postInfo.user.username;
  const result = await dbConn.query(
    `SELECT * FROM public."BLOG_POSTS" WHERE (fk_user_name='${userName}' AND url_slug='${newSlug}')`
  );

  if (result.rows.length > 0) {
    newSlug = `${newSlug}-${genSubSlug()}`;
  }
  // column name 스트링 생성 (validation 필요할 수도)
  const targetColStr = ['id', ...Object.getOwnPropertyNames(postInfo), 'url_slug', 'released_at']
    .filter(prop => prop !== '')
    .map(colName => (colName === 'user' ? 'fk_user_name' : colName))
    .join(',');

  // column value 스트링 생성
  const newPostInfoStr = [
    `'${v4()}'`,
    ...Object.values(postInfo).map(val => {
      if (typeof val === 'object') {
        return `'${val.username}'`;
      } else {
        return `'${val}'`;
      }
    }),
    `'${newSlug}'`,
    `'${new Date().toISOString()}'`,
  ]
    .filter(prop => prop !== '')
    .join(',');

  // 새로운 포스팅 생성 쿼리
  const insertQuery = `INSERT INTO public."BLOG_POSTS" (${targetColStr}) 
      VALUES (${newPostInfoStr}) 
      returning id;`;

  return insertQuery;
};

const updatePostQuery = async (postInfo: SinglePost) => {
  const userName = postInfo.user.username;
  const postId = postInfo.id;
  const result = await dbConn.query(
    `SELECT * FROM public."BLOG_POSTS" WHERE (fk_user_name='${userName}' AND id='${postId}')`
  );

  const postData = result.rows[0];
  if (postData.length === 0) {
    return '';
  }
  const valueAsignStr = [...Object.getOwnPropertyNames(postInfo), 'released_at']
    .filter((propName: string) => postInfo[propName])
    .map(
      propName => `${getDBColName(propName)} = ${getDBValueString(propName, postInfo[propName])}`
    )
    .join(',');

  return `UPDATE public."BLOG_POSTS" SET ${valueAsignStr} WHERE id = '${postData.id}'`;
};

const makeTempSaveQuery = async (postInfo: SinglePost) => {
  const postId = postInfo.id;
  const result = await dbConn.query(`SELECT * FROM public."BLOG_POSTS" WHERE id='${postId}'`);
  const postData = result.rows[0];
  let dbQuery = '';

  if (result.rows.length === 0) {
    const tempTableResult = await dbConn.query(
      `SELECT * FROM public."TEMP_POSTS" WHERE id='${postId}'`
    );
    // 원본과 임시 포스트 둘 다 없는 경우
    const newSlug = createUrlSlug(postInfo.title);
    // TEMP POST의 아이디는 새롭게 생성한다.
    const newPostInfo: SinglePost = { ...postInfo, id: v4() };
    if (tempTableResult.rows.length === 0) {
      // column name 스트링 생성 (validation 필요할 수도)
      const targetColStr = [...Object.getOwnPropertyNames(newPostInfo), 'url_slug', 'released_at']
        .filter(prop => prop !== '')
        .map(colName => (colName === 'user' ? 'fk_user_name' : colName))
        .join(',');

      // column value 스트링 생성
      const newPostInfoStr = [
        ...Object.values(newPostInfo).map(val => {
          if (typeof val === 'object') {
            return `'${val.username}'`;
          } else {
            return `'${val}'`;
          }
        }),
        `'${newSlug}'`,
        `'${new Date().toISOString()}'`,
      ]
        .filter(prop => prop !== '')
        .join(',');

      // 새로운 포스팅 생성 쿼리
      dbQuery = `INSERT INTO public."TEMP_POSTS" (${targetColStr}) 
          VALUES (${newPostInfoStr}) 
          returning id;`;
    } else {
      // 원본은 없으나 임시 포스트가 있는 경우
      const newPostInfo: SinglePost = {
        ...postInfo,
        url_slug: newSlug,
        released_at: new Date().toISOString(),
      };
      const dbColNames = [...Object.getOwnPropertyNames(newPostInfo)]
        .filter(prop => prop !== '')
        .map(colName => getDBColName(colName));
      const valueAsignStr = dbColNames
        .filter((propName: string) =>
          newPostInfo[propName] === 'user' ? 'fk_user_name' : newPostInfo[propName]
        )
        .map(propName => `${propName} = ${getDBValueString(propName, newPostInfo[propName])}`)
        .join(',');

      dbQuery = `UPDATE public."TEMP_POSTS" SET ${valueAsignStr} WHERE id = '${postId}' returning id;`;
    }
  } else if (postData.temp_post_id) {
    const valueAsignStr = [...Object.getOwnPropertyNames(postInfo), 'released_at']
      .filter((propName: string) => postInfo[propName])
      .map(propName => `${propName} = ${getDBValueString(propName, postInfo[propName])}`)
      .join(',');

    dbQuery = `UPDATE public."TEMP_POSTS" SET ${valueAsignStr} WHERE id = '${postData.temp_post_id}'`;
  } else {
    const newTempPostId = v4();
    const tempPostInfo: SinglePost = { ...postInfo, ...{ id: newTempPostId } };
    // column name 스트링 생성 (validation 필요할 수도)
    const targetColStr = [...Object.getOwnPropertyNames(tempPostInfo), 'released_at']
      .filter(prop => prop !== '')
      .map(colName => (colName === 'user' ? 'fk_user_name' : colName))
      .join(',');

    // column value 스트링 생성
    const newPostInfoStr = [
      ...Object.values(tempPostInfo).map(val =>
        typeof val === 'object' ? `'${val.username}'` : `'${val}'`
      ),
      `'${new Date().toISOString()}'`,
    ]
      .filter(prop => prop !== '')
      .join(',');

    const updateOrigPostQuery = `UPDATE public."BLOG_POSTS" SET temp_post_id = '${newTempPostId}'::text WHERE id = '${postId}'`;
    // 새로운 포스팅 생성 쿼리
    dbQuery = `INSERT INTO public."TEMP_POSTS" (${targetColStr}) 
    VALUES (${newPostInfoStr}) 
    returning id;
    ${updateOrigPostQuery}`;
  }

  return dbQuery;
};

// write page 요청
router.post('/write', async (req, response) => {
  const post = req.body;
  let query = '';
  let successMessage = '';

  query = await createPostQuery(post);
  successMessage = `Post ${post.id} created`;

  dbConn.query(query, (err, result) => {
    if (err) {
      return response.status(400).json(err);
    }
    return response.status(201).json(successMessage);
  });
});

// 임시 저장 구현
router.post('/write/tempsave', async (req, response) => {
  const postInfo = req.body;
  const query = await makeTempSaveQuery(postInfo);

  dbConn.query(query, (err, result) => {
    if (err) {
      return response.status(400).json(err);
    }
    return response.status(201).json(result.rows[0].id);
  });
});

export default router;

import express from 'express';
import dbConn from '../db/dbConn';

const router = express.Router();

router.get('/:userName/readingList/liked/', async (req, response) => {
  const { userName } = req.params;
  const result = await dbConn.query(
    `SELECT * FROM public."POST_LIKES" WHERE fk_user_id='${userName}' ORDER BY updated_at DESC;`
  );

  const likedPost = result.rows;
  return response.status(200).json(likedPost);
});

router.get('/:userName/readingList/liked/:loadPostCount', async (req, response) => {
  const { userName, loadPostCount } = req.params;
  const result = await dbConn.query(
    `SELECT * FROM public."POST_LIKES" as p JOIN public."BLOG_POSTS" as b ON p.fk_post_id = b.id WHERE p.fk_user_id='${userName}' ORDER BY updated_at DESC LIMIT 16 OFFSET ${
      +loadPostCount * 15
    };`
  );

  const likedPost = result.rows;
  return response.status(200).json(likedPost);
});

router.get('/:userName/liked/:postId', (req, response) => {
  const { userName, postId } = req.params;
  dbConn.query(
    `SELECT id FROM public."POST_LIKES" WHERE fk_user_id='${userName}' AND fk_post_id='${postId}'`,
    (err, result) => {
      console.log(result);
      const likedPost = result.rows;
      response.status(200).json(likedPost);
    }
  );
});

router.post('/:userName/like/:postId', async (req, response) => {
  const { userName, postId } = req.params;
  const postResult = await dbConn.query(`SELECT id FROM public."BLOG_POSTS" WHERE id='${postId}'`);

  if (postResult.rowCount === 0) {
    return response.status(404).json({ err: 'Post Not Found' });
  }

  const alreadyLiked = await dbConn.query(
    `SELECT id FROM public."POST_LIKES" WHERE fk_user_id='${userName}' AND fk_post_id='${postId}'`
  );

  if (alreadyLiked.rowCount !== 0) {
    return response.status(304).json(alreadyLiked);
  }

  const insertLiked = await dbConn.query(
    `INSERT INTO public."POST_LIKES" (created_at, updated_at, fk_post_id, fk_user_id) VALUES (current_timestamp, current_timestamp, '${postId}', '${userName}'); `
  );

  await syncPostCount(postId);

  return response.status(201).json(`${userName} liked ${postId}`);
});

router.post('/:userName/unlike/:postId', async (req, response) => {
  const { userName, postId } = req.params;
  const postResult = await dbConn.query(`SELECT id FROM public."BLOG_POSTS" WHERE id='${postId}'`);
  if (postResult.rowCount === 0) {
    return response.status(404).json({ err: 'Post Not Found' });
  }

  const alreadyLiked = await dbConn.query(
    `SELECT id FROM public."POST_LIKES" WHERE fk_user_id='${userName}' AND fk_post_id='${postId}'`
  );
  if (!alreadyLiked.rowCount) {
    return response.status(204).json({ err: 'Post Not Liked' });
  }

  const unliked = await dbConn.query(
    `DELETE FROM public."POST_LIKES" WHERE fk_user_id='${userName}' AND fk_post_id='${postId}'`
  );

  await syncPostCount(postId);

  return response.status(202).json(`${userName} unliked ${postId}`);
});

const syncPostCount = async (postId: string) => {
  const countResult = await dbConn.query(
    `SELECT COUNT(*) FROM public."POST_LIKES" WHERE fk_post_id='${postId}';`
  );

  try {
    await dbConn.query(
      `UPDATE public."BLOG_POSTS" SET likes='${countResult.rows[0].count}' WHERE id='${postId}';`
    );
  } catch (e) {
    return e;
  }
};

export default router;

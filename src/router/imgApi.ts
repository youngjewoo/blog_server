import express from 'express';
import { createReadStream } from 'fs';
import dbConn from '../db/dbConn';
import { getType } from 'mime';
import multer from 'multer';
import path from 'path';
import { validate } from 'uuid';

const router = express.Router();
const postImgDir = 'images/post';
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, postImgDir);
    },
    filename: function (req, file, cb) {
      if (validate(req.params.imageid.split('.')[0])) {
        cb(null, `${req.params.imageid}${path.extname(file.originalname)}`);
      }
    },
  }),
});

// 포스팅 이미지 GET
router.get('/images/:username/post/:imageid/:filename', (req, response) => {
  const fileNameAry = req.params.filename.split('.');
  const imgId = req.params.imageid;
  const imgPath = `${postImgDir}/${imgId}.${
    fileNameAry[req.params.filename.split('.').length - 1]
  }`;

  dbConn.query(`SELECT * FROM public."POST_IMAGES" WHERE id='${imgId}'`, (err, result) => {
    if (err) {
      return response.status(404).json(`Image [${req.params.filename}] NOT FOUND!`);
    }
    const fileSize = result.rows[0].file_size;
    const mimeType = getType(imgPath);

    if (mimeType === null) return response.status(404).json('Invalid image format!');

    // Header 세팅 (content type을 지정해줘야 Thunder client에서 정상적으로 보임)
    response.setHeader('Content-type', mimeType);
    response.setHeader('Content-length', fileSize);

    const fileStream = createReadStream(imgPath);
    fileStream.pipe(response);
  });
});

// 포스팅 이미지 업로드
router.post('/images/:username/post/:imageid/:filename', upload.single('img'), (req, response) => {
  if (req.file === undefined || validate(req.params.imageid) === false) {
    return response.status(400).json({ err: 'No file uploaded!' });
  }
  // user id 검색
  dbConn.query(
    `SELECT * FROM public."BLOG_USERS" WHERE velog_name='${req.params.username}'`,
    (err, result) => {
      const users = result.rows;
      // 이름에 해당하는 사용자가 없는 경우
      if (users.length === 0) {
        return response.status(404).json({ err: 'Unknown user' });
      }
      if (req.file === undefined) {
        return response.status(400).json({ err: 'No file uploaded!' });
      }

      // 새로운 이미지 생성 쿼리
      const tableCols = ['id', 'fk_post_id', 'fk_user_id', 'path', 'file_size'];
      const tableVals = [
        `'${req.params.imageid}'`,
        `'${req.body.post_id}'`,
        `'${users[0].user_id}'`,
        `'${postImgDir}/${req.file.filename}'`,
        `${req.file.size}`,
      ];
      const insertQuery = `INSERT INTO public."POST_IMAGES" (${tableCols.join(',')})
        VALUES (${tableVals.join(',')})
        returning id;`;

      // ID 중복 체크도 때리는게 좋음

      dbConn.query(insertQuery, (err, result) => {
        if (err) {
          console.log(err);
          return response.status(400).json(err);
        }
        return response.status(201).json(`Image ${req.params.imageid} upload success`);
      });
    }
  );
});

export default router;

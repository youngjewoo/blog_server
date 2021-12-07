import express from 'express';
import { createReadStream } from 'fs';
import dbConn from '../db/dbConn';
import { getType } from 'mime';

const router = express.Router();
const postImgDir = 'images/post';

// 이미지 GET
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

export default router;

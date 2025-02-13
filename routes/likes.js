const express = require('express');
const { toggleLikePost, toggleLikeComment } = require('../controllers/likeController');

const router = express.Router();

router.post('/posts/:postId/like', toggleLikePost);

router.post('/comments/:commentId/like', toggleLikeComment);

module.exports = router;

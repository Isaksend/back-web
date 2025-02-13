const express = require('express');
const { addComment, addReply, getComments } = require('../controllers/commentController');

const router = express.Router();

router.post('/posts/:postId/comments', addComment);
router.post('/comments/:commentId/replies', addReply);
router.get('/posts/:postId/comments', getComments);

module.exports = router;

const express = require('express');
const multer = require('multer');
const postController = require('../controllers/postController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', upload.single('file'), postController.updatePost);
router.delete('/:id', postController.deletePost);

module.exports = router;

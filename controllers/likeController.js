const Post = require('../models/Post');
const Comment = require('../models/Comment');

const toggleLikePost = async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const alreadyLiked = post.likes.includes(userId);

        if (alreadyLiked) {
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            message: alreadyLiked ? 'Like removed from post' : 'Post liked',
            likes: post.likes.length,
        });
    } catch (error) {
        console.error('Error toggling like on post:', error);
        res.status(500).json({ message: 'Failed to toggle like on post' });
    }
};

const toggleLikeComment = async (req, res) => {
    const { commentId } = req.params;
    const { userId } = req.body;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const alreadyLiked = comment.likes.includes(userId);

        if (alreadyLiked) {
            comment.likes = comment.likes.filter((id) => id.toString() !== userId);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        res.status(200).json({
            message: alreadyLiked ? 'Like removed from comment' : 'Comment liked',
            likes: comment.likes.length,
        });
    } catch (error) {
        console.error('Error toggling like on comment:', error);
        res.status(500).json({ message: 'Failed to toggle like on comment' });
    }
};

module.exports = { toggleLikePost, toggleLikeComment };

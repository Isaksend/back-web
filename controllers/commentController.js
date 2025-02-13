const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
    const { postId } = req.params;
    const { userId, content } = req.body;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = new Comment({
            postId,
            userId,
            content,
            parentCommentId: null,
        });

        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

exports.addReply = async (req, res) => {
    const { commentId } = req.params;
    const { userId, content } = req.body;

    try {
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ message: 'Parent comment not found' });
        }

        const reply = new Comment({
            postId: parentComment.postId,
            userId,
            content,
            parentCommentId: commentId,
        });

        await reply.save();
        res.status(201).json(reply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add reply' });
    }
};

exports.getComments = async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await Comment.find({ postId })
            .populate('userId', 'username')
            .sort({ createdAt: 1 });

        const commentMap = {};
        comments.forEach((comment) => {
            commentMap[comment._id] = { ...comment._doc, replies: [] };
        });

        const nestedComments = [];
        comments.forEach((comment) => {
            if (comment.parentCommentId) {
                commentMap[comment.parentCommentId].replies.push(commentMap[comment._id]);
            } else {
                nestedComments.push(commentMap[comment._id]);
            }
        });

        res.json(nestedComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const secret = process.env.JWT_SECRET;

exports.createPost = async (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, secret, async (err, userData) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        const cover = req.file ? req.file.path : 'uploads/default.jpg';
        try {
            const { title, summary, content } = req.body;
            const newPost = await Post.create({
                title,
                summary,
                content,
                cover,
                author: userData.id,
            });

            await User.findByIdAndUpdate(userData.id, {
                $push: { posts: newPost._id },
            });

            res.status(201).json(newPost);
        } catch (error) {
            console.error("Error creating post:", error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

exports.getAllPosts = async (req, res) => {
    const posts = await Post.find().populate('author', ['username']).sort({ createdAt: -1 });
    res.json(posts);
};

exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', ['username']);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updatePost = async (req, res) => {
    const { token } = req.cookies;
    const { id } = req.params;

    if (!token) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, secret, async (err, userData) => {
        if (err) return res.status(403).json({ error: 'Unauthorized' });

        const post = await Post.findById(id);
        if (!post || post.author.toString() !== userData.id) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (req.file) {
            fs.unlinkSync(post.cover);
            post.cover = req.file.path;
        }

        post.title = req.body.title;
        post.summary = req.body.summary;
        post.content = req.body.content;
        await post.save();

        res.json(post);
    });
};

exports.deletePost = async (req, res) => {
    const { token } = req.cookies;
    const { id } = req.params;

    jwt.verify(token, secret, async (err, userData) => {
        if (err) return res.status(403).json({ error: 'Unauthorized' });

        const post = await Post.findById(id);
        if (!post || post.author.toString() !== userData.id) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await Post.findByIdAndDelete(id);
        res.json({ message: 'Post deleted' });
    });
};

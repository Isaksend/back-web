const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const likesRouter = require('./routes/likes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Подключение Passport
app.use(passport.initialize());
app.use(passport.session());

// Подключение маршрутов
app.use('/api/users', userRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likesRouter);

module.exports = app;

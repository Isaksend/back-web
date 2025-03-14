const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const likesRouter = require('./routes/likes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            httpOnly: true, // Куки не доступны JavaScript на клиенте
            secure: true, // Обязательно true для HTTPS
            sameSite: 'None', // Разрешает передачу кук между разными доменами
            maxAge: 1000 * 60 * 60 * 24, // 1 день
        },
    })
);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    console.log("КУКИ НА СЕРВЕРЕ:", req.cookies);
    console.log("ЗАГОЛОВКИ НА СЕРВЕРЕ:", req.headers);
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

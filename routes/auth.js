const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Начало авторизации через Google
router.get('/google', (req, res, next) => {
    console.log('Google auth initiated');
    next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback URL после авторизации
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id, username: req.user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Устанавливаем токен в куки
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });


        res.redirect('http://localhost:3000'); // Перенаправляем пользователя на главную страницу
    }
);

router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error('Ошибка при выходе из аккаунта:', err);
        }
        res.redirect('/');
    });
});

router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

module.exports = router;

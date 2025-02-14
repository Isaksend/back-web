const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const secret = process.env.JWT_SECRET;
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const verificationCodes = new Map();

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        verificationCodes.set(email, { code: verificationCode, expiresAt: Date.now() + 10 * 60 * 1000 });
        console.log('Коды в памяти после сохранения:', verificationCodes);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification Code',
            text: `Your verification code is: ${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ message: 'Failed to send verification code' });
    }
};

exports.verifyCode = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and code are required' });
    }

    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: 'Verification code must be exactly 6 digits.' });
    }

    console.log('Получение кода для email:', email);
    console.log('Коды в памяти:', verificationCodes);

    const savedCodeEntry  = verificationCodes.get(email);

    if (!savedCodeEntry || savedCodeEntry.expiresAt < Date.now()) {
        verificationCodes.delete(email);
        console.log('Ошибка: Код устарел');
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Проверяем, что код совпадает
    if (savedCodeEntry.code !== code) {
        return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.status(200).json({ message: 'Email verified successfully' });
};


exports.register = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ message: "Please fill all fields: username, password, email" });
    }
    try {
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const newUser = await User.create({ username, password: hashedPassword, email });
        res.status(200).json(newUser);
    } catch (error) {
        console.error("Error creating user:", error);

        if (error.code === 11000) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, secret, { expiresIn: '1h' });

    res.cookie('token', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ id: user._id, username: user.username });
};

exports.getProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('posts');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};

exports.getProfile = (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        User.findById(decoded.id)
            .then(user => {
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json({
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    city: user.city,
                    createdAt: user.createdAt,
                    posts: user.posts
                });
            })
            .catch(err => res.status(500).json({ message: 'Server error', error: err.message }));
    } catch (err) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

exports.updateProfileWithVerification = async (req, res) => {
    const { email, username, city, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const savedCodeEntry  = verificationCodes.get(email);

    console.log('Введённый код:', code);
    console.log('Сохранённый код:', savedCodeEntry);

    if (!savedCodeEntry  || savedCodeEntry.expiresAt < Date.now()) {
        verificationCodes.delete(email);
        console.log('Ошибка: Код устарел');
        return res.status(400).json({ message: 'Invalid or expired code' });
    }
    if (savedCodeEntry.code !== code) {
        console.log('Ошибка: Код неверный');
        return res.status(400).json({ message: 'Invalid verification code' });
    }
    try {
        const userId = req.user.id;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { email, username, city },
            { new: true, runValidators: true }
        );
        verificationCodes.delete(email);
        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
};

exports.changePasswordWithVerification = async (req, res) => {
    const { email, newPassword, code } = req.body;

    // Проверка обязательных параметров
    if (!email || !newPassword || !code) {
        return res.status(400).json({ message: 'Email, new password, and verification code are required' });
    }

    // Валидация кода
    const savedCodeEntry = verificationCodes.get(email);

    console.log('Введённый код:', code);
    console.log('Сохранённый код:', savedCodeEntry);

    if (!savedCodeEntry || savedCodeEntry.expiresAt < Date.now()) {
        verificationCodes.delete(email);
        console.log('Ошибка: Код устарел');
        return res.status(400).json({ message: 'Invalid or expired code' });
    }
    if (savedCodeEntry.code !== code) {
        console.log('Ошибка: Код неверный');
        return res.status(400).json({ message: 'Invalid verification code' });
    }

    try {
        // Получение ID пользователя из запроса
        const userId = req.user.id;

        // Хеширование нового пароля
        const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

        // Обновление пароля пользователя
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.password = hashedPassword;
        await user.save();

        // Удаление кода из памяти
        verificationCodes.delete(email);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};


exports.post('/logout', (req, res) => {
    console.log("До очистки:", req.cookies);
    // res.clearCookie('connect.sid', { path: '/' });  <-- временно убираем
    console.log("После очистки:", req.cookies);
    req.session.destroy((err) => {
        if (err) {
            console.error("Ошибка при удалении сессии:", err);
            return res.status(500).json({ message: "Ошибка выхода" });
        }
        res.json({ message: "Вы успешно вышли" });
    });
});






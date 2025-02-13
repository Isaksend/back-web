const express = require('express');
const userController = require('../controllers/userController');
const decodeToken = require('../middleware/decodeToken');
const authenticateUser = require('../middleware/authenticateUser');

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile/:id', userController.getProfileById);
router.get('/profile', userController.getProfile);
router.put('/update-profile', authenticateUser, userController.updateProfileWithVerification);
router.put('/change-password', authenticateUser, userController.changePasswordWithVerification);
router.post('/logout', userController.logout);
router.post('/send-verification-code', userController.sendVerificationCode);
router.post('/verify-code', userController.verifyCode);


module.exports = router;

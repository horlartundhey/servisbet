const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateDetails,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  resendVerificationEmailPublic,
  forgotPassword,
  resetPassword,
  checkEmailAvailability
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', verifyToken, resendVerificationEmail);
router.post('/resend-verification-public', resendVerificationEmailPublic);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Utility routes
router.post('/check-email', checkEmailAvailability);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/updatedetails', verifyToken, updateDetails);
router.put('/updatepassword', verifyToken, updatePassword);

module.exports = router;

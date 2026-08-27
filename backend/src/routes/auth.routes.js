// Authentication routes only map HTTP requests to controllers/middleware.

const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  validateRegistration,
  validateLogin,
} = require('../middleware/validation.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', logoutHandler);
router.delete('/logout', logoutHandler);

async function logoutHandler(req, res) {
  authController.logout(req, res);
}

module.exports = router;

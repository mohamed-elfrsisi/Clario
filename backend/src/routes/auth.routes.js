// Authentication routes only map HTTP requests to controllers/middleware.

const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegistration } = require('../middleware/validation.middleware');

const router = express.Router();

router.post('/register', validateRegistration, authController.register);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, register, me, changePassword } = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').notEmpty().withMessage('Senha obrigatória')
], validate, login);

// POST /api/auth/register (apenas admin)
router.post('/register', authenticate, authorize('administrador'), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('cargo').optional().isIn(['administrador', 'operador', 'motorista']).withMessage('Cargo inválido')
], validate, register);

// GET /api/auth/me
router.get('/me', authenticate, me);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, [
  body('senha_atual').notEmpty().withMessage('Senha atual obrigatória'),
  body('nova_senha').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
], validate, changePassword);

module.exports = router;

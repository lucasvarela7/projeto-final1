const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/usuariosController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(authenticate);

router.get('/', authorize('administrador'), ctrl.listar);
router.get('/:id', authorize('administrador'), ctrl.buscarPorId);
router.post('/', authorize('administrador'), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha mínima 6 caracteres'),
  body('cargo').optional().isIn(['administrador', 'operador', 'motorista'])
], validate, ctrl.criar);
router.put('/:id', authorize('administrador'), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido')
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

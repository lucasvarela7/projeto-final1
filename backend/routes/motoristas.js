const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/motoristasController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(authenticate);

router.get('/estatisticas', ctrl.estatisticas);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', authorize('administrador', 'operador'), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('cpf').notEmpty().withMessage('CPF obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone obrigatório'),
  body('cnh').notEmpty().withMessage('CNH obrigatória'),
  body('vehicle_id').optional({ values: 'falsy' }).isInt().withMessage('Veículo inválido')
], validate, ctrl.criar);
router.put('/:id', authorize('administrador', 'operador'), [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('cpf').notEmpty().withMessage('CPF obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone obrigatório'),
  body('cnh').notEmpty().withMessage('CNH obrigatória'),
  body('vehicle_id').optional({ values: 'falsy' }).isInt().withMessage('Veículo inválido')
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/entregasController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', authorize('administrador', 'operador'), [
  body('cliente_nome').notEmpty().withMessage('Nome do cliente obrigatório'),
  body('endereco_origem').notEmpty().withMessage('Endereço de origem obrigatório'),
  body('endereco_destino').notEmpty().withMessage('Endereço de destino obrigatório'),
  body('data_prevista').notEmpty().withMessage('Data prevista obrigatória').isISO8601().withMessage('Data inválida'),
  body('vehicle_id').optional({ values: 'falsy' }).isInt().withMessage('Veículo inválido'),
  body('customer_id').optional({ values: 'falsy' }).isInt().withMessage('Cliente inválido')
], validate, ctrl.criar);
router.put('/:id', authorize('administrador', 'operador'), [
  body('cliente_nome').notEmpty().withMessage('Nome do cliente obrigatório'),
  body('endereco_origem').notEmpty().withMessage('Endereço de origem obrigatório'),
  body('endereco_destino').notEmpty().withMessage('Endereço de destino obrigatório'),
  body('data_prevista').notEmpty().withMessage('Data prevista obrigatória'),
  body('vehicle_id').optional({ values: 'falsy' }).isInt().withMessage('Veículo inválido'),
  body('customer_id').optional({ values: 'falsy' }).isInt().withMessage('Cliente inválido')
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

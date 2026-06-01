const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/rotasController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(authenticate);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', authorize('administrador', 'operador'), [
  body('nome').notEmpty().withMessage('Nome da rota obrigatório'),
  body('cidade_origem').notEmpty().withMessage('Cidade de origem obrigatória'),
  body('cidade_destino').notEmpty().withMessage('Cidade de destino obrigatória')
], validate, ctrl.criar);
router.put('/:id', authorize('administrador', 'operador'), [
  body('nome').notEmpty().withMessage('Nome da rota obrigatório'),
  body('cidade_origem').notEmpty().withMessage('Cidade de origem obrigatória'),
  body('cidade_destino').notEmpty().withMessage('Cidade de destino obrigatória')
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

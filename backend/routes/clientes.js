const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/clientesController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Lista clientes
 *     tags: [Customers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', ctrl.listar);
router.get('/estatisticas', ctrl.estatisticas);
router.get('/:id', ctrl.buscarPorId);
router.post('/', authorize('administrador', 'operador'), [
  body('name').notEmpty().withMessage('Nome obrigatório'),
  body('cpf_cnpj').notEmpty().withMessage('CPF/CNPJ obrigatório')
], validate, ctrl.criar);
router.put('/:id', authorize('administrador', 'operador'), [
  body('name').notEmpty().withMessage('Nome obrigatório'),
  body('cpf_cnpj').notEmpty().withMessage('CPF/CNPJ obrigatório')
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

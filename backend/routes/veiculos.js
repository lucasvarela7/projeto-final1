const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/veiculosController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/veiculos:
 *   get:
 *     summary: Lista veículos
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de veículos
 */
router.get('/', ctrl.listar);
router.get('/estatisticas', ctrl.estatisticas);
router.get('/:id', ctrl.buscarPorId);
router.post('/', authorize('administrador', 'operador'), [
  body('license_plate').notEmpty().withMessage('Placa obrigatória'),
  body('model').notEmpty().withMessage('Modelo obrigatório'),
  body('manufacturer').notEmpty().withMessage('Fabricante obrigatório'),
  body('status').optional().isIn(['available', 'in_use', 'maintenance', 'inactive'])
], validate, ctrl.criar);
router.put('/:id', authorize('administrador', 'operador'), [
  body('license_plate').notEmpty().withMessage('Placa obrigatória'),
  body('model').notEmpty().withMessage('Modelo obrigatório'),
  body('manufacturer').notEmpty().withMessage('Fabricante obrigatório'),
  body('status').optional().isIn(['available', 'in_use', 'maintenance', 'inactive'])
], validate, ctrl.atualizar);
router.delete('/:id', authorize('administrador'), ctrl.excluir);

module.exports = router;

const { validationResult } = require('express-validator');

/**
 * Middleware para capturar erros de validação do express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(e => ({ campo: e.path, mensagem: e.msg }))
    });
  }
  next();
};

module.exports = validate;

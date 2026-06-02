const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LogiTrack API',
      version: '1.1.0',
      description: 'Documentação das APIs de logística, rastreamento, frota e clientes.'
    },
    servers: [{ url: 'http://localhost:3001', description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      examples: {
        LoginRequest: {
          summary: 'Exemplo de login',
          value: { email: 'admin@logitrack.com', senha: 'password' }
        },
        SuccessResponse: {
          summary: 'Resposta de sucesso',
          value: { success: true, message: 'Operação realizada com sucesso', data: {} }
        },
        ErrorResponse: {
          summary: 'Resposta de erro',
          value: { success: false, message: 'Recurso não encontrado' }
        }
      }
    }
  },
  apis: ['./routes/*.js', './docs/swaggerSchemas.js']
};

module.exports = swaggerJsDoc(options);

# Manual de Instalação e Configuração - LogiTrack

Este manual orienta o passo a passo para configurar e executar o sistema **LogiTrack** em ambiente de desenvolvimento local ou em produção.

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
1. **Node.js** (Versão 16.x ou superior recomendada)
2. **NPM** ou **Yarn**
3. **MySQL Server** (Versão 8.0 ou superior)

---

## Passo 1: Clonar ou Extrair o Projeto

Navegue até o diretório do projeto:
```bash
cd LogiTrack
```

O projeto possui a seguinte estrutura profissional:
```text
/LogiTrack
  /backend
    /config
    /controllers
    /middlewares
    /models
    /routes
    /services
    server.js
  /frontend
    /css
    /js
    index.html
  /docs
```

---

## Passo 2: Configurar o Banco de Dados MySQL

1. Abra o seu cliente MySQL (MySQL Workbench, phpMyAdmin ou terminal).
2. Execute o script SQL localizado em `/backend/config/database.sql` para criar o banco de dados, as tabelas e popular com os dados iniciais de demonstração:
   ```bash
   mysql -u seu_usuario -p < backend/config/database.sql
   ```

---

## Passo 3: Configurar as Variáveis de Ambiente (.env)

Navegue até a pasta `/backend` e crie/edite o arquivo `.env`:
```bash
cd backend
```

Configure as variáveis de acordo com o seu ambiente local:
```env
PORT=3001
NODE_ENV=development

# Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=logitrack
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=24h
```

---

## Passo 4: Instalar as Dependências

Ainda dentro da pasta `/backend`, execute o comando para instalar todas as dependências do Node.js:
```bash
npm install
```

---

## Passo 5: Executar o Servidor

Para iniciar o servidor em modo de desenvolvimento (com recarregamento automático via `nodemon`):
```bash
npm run dev
```

Para iniciar em modo de produção:
```bash
npm start
```

O servidor iniciará na porta configurada (padrão: `3001`). Você verá a seguinte mensagem no console:
```text
✅ Conexão com MySQL estabelecida com sucesso
http://localhost:3001
```

---

## Passo 6: Acessar a Interface Web

O backend está configurado para servir os arquivos estáticos do frontend. Portanto, basta abrir o seu navegador e acessar:
* **URL:** `http://localhost:3001`

### Contas de Demonstração para Apresentação:
O banco de dados já vem populado com as seguintes contas para testes:

| Cargo | E-mail | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin@logitrack.com` | `password` |
| **Operador Logístico** | `operador@logitrack.com` | `password` |

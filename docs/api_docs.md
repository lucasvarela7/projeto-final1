# Documentação da API REST - LogiTrack

A API do LogiTrack foi desenvolvida seguindo os padrões RESTful, utilizando respostas padronizadas em JSON, códigos de status HTTP apropriados e autenticação via JWT (JSON Web Tokens).

## Padrão de Resposta

Todas as respostas da API seguem o seguinte formato:

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Mensagem descritiva do erro",
  "errors": [ ... ] // Opcional, lista de erros de validação
}
```

---

## Autenticação

A maioria das rotas requer o cabeçalho `Authorization` contendo o token JWT:
```http
Authorization: Bearer <seu_token_jwt>
```

### 1. Login de Usuário
* **Rota:** `POST /api/auth/login`
* **Autenticação:** Não requer.
* **Corpo da Requisição:**
  ```json
  {
    "email": "admin@logitrack.com",
    "senha": "password"
  }
  ```
* **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "data": {
      "token": "eyJhbGciOiJIUzI1...",
      "usuario": {
        "id": 1,
        "nome": "Administrador",
        "email": "admin@logitrack.com",
        "cargo": "administrador"
      }
    }
  }
  ```

### 2. Obter Usuário Autenticado
* **Rota:** `GET /api/auth/me`
* **Autenticação:** Requer Token.

---

## Módulo de Motoristas

### 1. Listar Motoristas
* **Rota:** `GET /api/motoristas`
* **Autenticação:** Requer Token.
* **Parâmetros de Busca (Query):**
  * `page`: Número da página (padrão: 1)
  * `limit`: Quantidade de registros (padrão: 10)
  * `status`: Filtrar por status (`ativo`, `inativo`, `em_rota`, etc.)
  * `busca`: Termo de pesquisa (nome, CPF ou CNH)

### 2. Cadastrar Motorista
* **Rota:** `POST /api/motoristas`
* **Autenticação:** Requer Token (Administrador ou Operador).
* **Corpo da Requisição:**
  ```json
  {
    "nome": "Carlos Silva",
    "cpf": "123.456.789-00",
    "telefone": "(11) 99999-1111",
    "cnh": "CNH001234",
    "categoria_cnh": "C",
    "veiculo": "Caminhão Truck VW 17.280",
    "placa_veiculo": "ABC-1234",
    "status": "ativo"
  }
  ```

### 3. Atualizar Motorista
* **Rota:** `PUT /api/motoristas/:id`
* **Autenticação:** Requer Token (Administrador ou Operador).

### 4. Excluir Motorista
* **Rota:** `DELETE /api/motoristas/:id`
* **Autenticação:** Requer Token (Apenas Administrador).

---

## Módulo de Entregas

### 1. Listar Entregas
* **Rota:** `GET /api/entregas`
* **Autenticação:** Requer Token.
* **Parâmetros de Busca (Query):** `page`, `limit`, `status`, `busca`, `data_inicio`, `data_fim`

### 2. Obter Detalhes da Entrega (com Histórico de Rastreamento)
* **Rota:** `GET /api/entregas/:id`
* **Autenticação:** Requer Token.

### 3. Cadastrar Entrega
* **Rota:** `POST /api/entregas`
* **Autenticação:** Requer Token (Administrador ou Operador).
* **Corpo da Requisição:**
  ```json
  {
    "cliente_nome": "Empresa ABC Ltda",
    "cliente_telefone": "(11) 3333-1111",
    "endereco_origem": "Av. Paulista, 1000 - São Paulo/SP",
    "endereco_destino": "Rua do Comércio, 500 - Rio de Janeiro/RJ",
    "data_prevista": "2026-06-05T18:00:00.000Z",
    "motorista_id": 1,
    "rota_id": 1
  }
  ```

### 4. Atualizar Entrega
* **Rota:** `PUT /api/entregas/:id`
* **Autenticação:** Requer Token.

### 5. Excluir Entrega
* **Rota:** `DELETE /api/entregas/:id`
* **Autenticação:** Requer Token (Apenas Administrador).

---

## Módulo de Rastreamento

### 1. Atualizar Localização / Status
* **Rota:** `POST /api/rastreamento/entrega/:entrega_id`
* **Autenticação:** Requer Token.
* **Corpo da Requisição:**
  ```json
  {
    "localizacao": "Rodovia Presidente Dutra, km 150",
    "status": "em_rota",
    "descricao": "Saiu para entrega - em trânsito"
  }
  ```

### 2. Exportar para Excel
* **Rota:** `GET /api/rastreamento/export/excel`
* **Autenticação:** Requer Token.

### 3. Exportar para PDF
* **Rota:** `GET /api/rastreamento/export/pdf`
* **Autenticação:** Requer Token.

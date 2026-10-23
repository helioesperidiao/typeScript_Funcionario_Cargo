# Sistema de Gestão de Funcionários e Cargos

Sistema web em TypeScript para gestão de usuários, cargos e autenticação de acesso em ambiente corporativo. O projeto combina backend em Node.js + Express, banco de dados MongoDB e páginas estáticas com interface administrativa para cadastro e consulta de funcionários.

## Visão geral

Este projeto foi desenvolvido para controlar:

- cadastro de cargos;
- cadastro de funcionários;
- login com autenticação JWT;
- controle de autorização para operações administrativas;
- painel web com páginas de login, dashboard e gerenciamento de registros;
- persistência em MongoDB.

A aplicação também inicializa automaticamente um usuário administrador padrão, caso ainda não exista nenhum registro no banco.

## Stack tecnológica

- Node.js
- TypeScript
- Express
- MongoDB (driver nativo)
- JWT (JSON Web Token)
- bcrypt
- Nginx (proxy reverso)
- Nodemon
- Bootstrap (front-end estático)

## Estrutura do projeto

```text
.
├── nginx/                    # Binário e configuração do Nginx
├── logs/                     # Logs da aplicação
├── src/
│   ├── controllers/          # Controladores HTTP
│   ├── dao/                  # Camadas de acesso a dados
│   ├── database/             # Conexão e configuração do MongoDB
│   ├── http/                 # Respostas HTTP, JWT e utilitários
│   ├── logging/              # Logger da aplicação
│   ├── middlewares/          # Middlewares de autenticação
│   ├── models/               # Entidades de domínio
│   ├── public/               # HTML, CSS e JS estáticos
│   ├── routers/              # Rotas da API
│   ├── services/             # Regras de negócio
│   ├── index.ts              # Ponto de entrada da aplicação
│   ├── Server.ts             # Configuração do Express
│   └── projeto_exportado.txt # Exportação/backup do projeto
├── .env.example             # Exemplo de configuração de ambiente (se aplicado)
├── nodemon.json             # Configuração do nodemon
├── package.json             # Scripts e dependências
├── tsconfig.json            # Configuração do TypeScript
├── README.md                # Documentação do projeto
└── ...
```

## Funcionalidades principais

### Autenticação

- Login de funcionários via API REST
- Geração de token JWT
- Middleware para validação de rotas protegidas
- Usuário administrador com criação automática

### Gestão de cargos

- Criação de cargos
- Listagem de cargos
- Consulta por ID
- Atualização
- Exclusão
- Contagem de registros

### Gestão de funcionários

- Cadastro de funcionários
- Listagem geral
- Busca por ID
- Atualização de dados
- Exclusão de registros
- Contagem por cargo
- Campo para indicar se recebe vale-transporte

### Front-end estático

A pasta `src/public` contém páginas como:

- `login.html`
- `dashboard.html`
- `funcionarios.html`
- `cargos.html`

Essas telas consomem a API e exibem os dados em interface simples, com Bootstrap.

## Pré-requisitos

Antes de rodar o projeto, confirme que os itens abaixo estão instalados:

- Node.js 18 ou superior
- npm
- MongoDB em execução localmente ou acessível por rede
- Nginx disponível no ambiente (o projeto já inclui a pasta `nginx/`)

## Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto com variáveis como as abaixo:

```env
PORT=3000

MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=faltas_cti
MONGO_MAX_POOL_SIZE=50
MONGO_MIN_POOL_SIZE=10
MONGO_CONNECT_TIMEOUT_MS=5000
MONGO_SOCKET_TIMEOUT_MS=45000

JWT_SECRET=seu_valor_secreto
JWT_ALGORITHM=HS256
JWT_TYPE=JWT
JWT_ISSUER=http://localhost
JWT_AUDIENCE=http://localhost
JWT_SUBJECT=acesso_sistema
JWT_EXPIRES_IN_SECONDS=5184000

DEFAULT_ADMIN_NAME=Hélio Esperidião
DEFAULT_ADMIN_EMAIL=helioesperidiao@gmail.com
DEFAULT_ADMIN_PASSWORD=@Helio123456
DEFAULT_ADMIN_VALE_TRANSPORTE=0
```

> O projeto usa as variáveis do ambiente para se conectar ao MongoDB e gerar tokens JWT.

## Instalação

```bash
npm install
```

## Execução

### Modo de desenvolvimento

```bash
npm run dev
```

Esse script inicia a aplicação e também levanta o Nginx local para servir os arquivos estáticos em porta definida pelo proxy.

### Acesso ao sistema

A aplicação pode ser acessada pela URL:

```text
http://localhost:8080/
```

Para login, normalmente a rota é:

```text
http://localhost:8080/login.html
```

> O projeto foi configurado para usar o Nginx como proxy reverso e apontar para o backend Node.js. Em desenvolvimento, normalmente o acesso via `localhost:8080` é o fluxo recomendado.

## API principal

A aplicação expõe endpoints REST na base:

```text
/api/v1
```

### Funcionários

```http
POST /api/v1/funcionarios/login
POST /api/v1/funcionarios/
GET  /api/v1/funcionarios/
GET  /api/v1/funcionarios/:idFuncionario
GET  /api/v1/funcionarios/count
GET  /api/v1/funcionarios/count/:idCargo
PUT  /api/v1/funcionarios/:idFuncionario
DELETE /api/v1/funcionarios/:idFuncionario
```

### Cargos

```http
POST /api/v1/cargos/
GET  /api/v1/cargos/
GET  /api/v1/cargos/:idCargo
GET  /api/v1/cargos/count
PUT  /api/v1/cargos/:idCargo
DELETE /api/v1/cargos/:idCargo
```

## Modelo de dados

Os principais modelos são:

- `Funcionario`
  - `idFuncionario`
  - `nomeFuncionario`
  - `email`
  - `senha`
  - `cargo`
  - `recebeValeTransporte`

- `Cargo`
  - `idCargo`
  - `nomeCargo`

## Observações importantes

- O sistema exige autenticação para operações de criação, listagem, atualização e exclusão em rotas protegidas.
- A senha do usuário é armazenada com hash via `bcrypt`.
- O administrador padrão é criado automaticamente quando o banco está vazio.
- O projeto serve arquivos estáticos em `src/public`, que incluem as páginas do painel administrativo.

## Scripts disponíveis

No arquivo `package.json`, há os scripts:

```bash
npm run dev
npm run build
npm run start
npm test
npm run lint
npm run lint:fix
```

## Informações de execução em produção

Para uso em ambiente de produção, ajuste:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `DEFAULT_ADMIN_*`
- permissões de acesso do Nginx
- políticas de CORS e segurança

## Contribuição

Sinta-se à vontade para clonar, testar e adaptar o projeto conforme as necessidades da sua operação. Se for necessário evoluir o sistema, a estrutura atual facilita a expansão para novos módulos.


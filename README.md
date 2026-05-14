# HCM System - Human Capital Management

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.x-green)
![SAP UI5](https://img.shields.io/badge/SAP-UI5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-red)

Sistema de **Gestão de Capital Humano (HCM)** desenvolvido com **Spring Boot + PostgreSQL no backend** e **SAP UI5 (Fiori) no frontend**.

O sistema permite gerenciar:

* Funcionários
* Departamentos
* Estrutura organizacional
* Usuários do sistema
* Solicitações de ausência
* Aprovação de solicitações por gerente e RH

---

# Visão Geral do Sistema

O sistema foi desenvolvido com arquitetura **Backend + Frontend desacoplados**.

```text
SAP UI5 (Frontend)
        |
REST API
        |
Spring Boot (Backend)
        |
PostgreSQL Database
```

Em produção com Docker, o frontend é servido por **Nginx**, que também encaminha as chamadas HTTP para o backend.

```text
Browser
  |
Nginx (Frontend)
  |
Spring Boot API
  |
PostgreSQL
```

---

# Tecnologias Utilizadas

## Backend

* Java 21
* Spring Boot 4
* Spring Security
* JWT Authentication
* JPA / Hibernate
* Maven

## Frontend

* SAP UI5
* SAP Fiori Design
* JavaScript
* JSONModel
* Nginx para servir a build em produção

## Banco de Dados

* PostgreSQL

## Infraestrutura

* Docker
* Docker Compose
* AWS EC2

---

# Perfis de Usuário

O sistema possui **4 níveis de acesso**.

## ADMIN

Pode:

* Criar funcionários
* Criar usuários e senhas
* Definir departamento
* Definir gerente
* Alterar cargos
* Gerenciar acessos
* Ativar / desativar usuários
* Visualizar dashboard completo
* Aprovar solicitações de ausência
* Gerenciar departamentos

---

## HR (Recursos Humanos)

Pode:

* Gerenciar funcionários
* Editar dados
* Criar departamentos
* Visualizar dashboard
* Visualizar organograma
* Visualizar solicitações de ausência

---

## MANAGER

Pode:

* Aprovar solicitações de ausência dos subordinados
* Rejeitar solicitações

---

## EMPLOYEE

Pode:

* Criar solicitação de ausência
* Visualizar suas solicitações

---

# Funcionalidades

## Dashboard

O dashboard apresenta:

* Total de funcionários
* Total de departamentos
* Funcionários sem gerente
* Funcionários sem departamento
* Funcionários recentes
* Distribuição de funcionários por departamento

---

## Gestão de Funcionários

Permite:

* Criar funcionário
* Definir cargo
* Definir salário
* Definir gerente
* Definir departamento
* Criar usuário e senha do sistema

---

## Organograma

O sistema gera automaticamente a árvore organizacional baseada na relação:

```text
Employee -> Manager
```

---

## Solicitações de Ausência

Fluxo completo:

```text
Employee cria solicitação
        |
Manager aprova ou rejeita
        |
HR visualiza e gerencia
```

---

# Estrutura do Projeto

```text
hcm-system/
├── docker-compose.yml
├── .env.example
├── DEPLOY_AWS_EC2.md
├── hcm-system/       # Backend Spring Boot
└── hcm-ui/           # Frontend SAP UI5
```

## Backend

```text
hcm-system/src/main/java/com/mahyhaker/hcm

config
├── SecurityConfig
├── JwtAuthenticationFilter
└── DataInitializer

controller
├── AuthController
├── EmployeeController
├── UserController
└── LeaveRequestController

service
├── EmployeeService
├── UserService
└── JwtService

repository
├── EmployeeRepository
├── UserRepository
├── DepartmentRepository
└── LeaveRequestRepository

model
├── Employee
├── User
├── Department
└── LeaveRequest
```

## Frontend

```text
hcm-ui/webapp

controller
├── Login.controller.js
├── Dashboard.controller.js
├── Main.controller.js
├── Detail.controller.js
├── Departments.controller.js
├── OrgTree.controller.js
├── LeaveRequests.controller.js
├── ManagerApprovals.controller.js
└── HrApprovals.controller.js

view
fragments
Component.js
manifest.json
```

---

# Autenticação

O sistema utiliza **JWT (JSON Web Token)**.

Após login, o backend retorna:

```json
{
  "token": "...",
  "username": "admin",
  "role": "ADMIN",
  "employeeId": 1
}
```

O token é enviado nas requisições autenticadas:

```text
Authorization: Bearer TOKEN
```

---

# Usuário Inicial

Ao iniciar o sistema, um usuário administrador é criado automaticamente.

```text
username: admin
password: 123
role: ADMIN
```

---

# Executando com Docker

## 1. Clonar o projeto

```bash
git clone https://github.com/Mahyhaker/E.-S.-P..git
cd E.-S.-P.
```

## 2. Criar arquivo de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e troque a senha do PostgreSQL:

```env
POSTGRES_DB=hcm_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_forte

SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=false
```

## 3. Subir a aplicação

```bash
docker compose up -d --build
```

Frontend:

```text
http://localhost
```

Backend:

```text
http://localhost:8080
```

## 4. Comandos úteis

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose down
```

Para parar e apagar o volume local do banco:

```bash
docker compose down -v
```

---

# Executando sem Docker

## 1. Configurar PostgreSQL

Crie um banco local:

```sql
CREATE DATABASE hcm_db;
```

O backend usa variáveis de ambiente, mas também possui valores padrão em:

```text
hcm-system/src/main/resources/application.properties
```

## 2. Rodar o backend

```bash
cd hcm-system
./mvnw spring-boot:run
```

No Windows:

```powershell
cd hcm-system
.\mvnw.cmd spring-boot:run
```

Servidor:

```text
http://localhost:8080
```

## 3. Rodar o frontend

```bash
cd hcm-ui
npm install
npm run start-local
```

Aplicação:

```text
http://localhost:8081
```

---

# Deploy na AWS EC2

Este projeto já possui Dockerfile para backend, Dockerfile para frontend e `docker-compose.yml`.

Resumo do deploy:

1. Criar uma instância EC2 Ubuntu.
2. Liberar no Security Group:
   * Porta `22` para SSH, de preferência apenas para seu IP.
   * Porta `80` para HTTP.
3. Instalar Docker e Docker Compose na EC2.
4. Clonar o repositório.
5. Criar o `.env`.
6. Rodar `docker compose up -d --build`.

Exemplo dentro da EC2:

```bash
git clone https://github.com/Mahyhaker/E.-S.-P..git
cd E.-S.-P.
cp .env.example .env
nano .env
docker compose up -d --build
```

Depois acesse:

```text
http://IP_PUBLICO_DA_EC2
```

Mais detalhes estão no arquivo:

```text
DEPLOY_AWS_EC2.md
```

---

# Reset do Banco

Para limpar o banco e reiniciar IDs:

```sql
TRUNCATE TABLE
    leave_request,
    users,
    employee,
    department
RESTART IDENTITY CASCADE;
```

Após reiniciar o backend, o usuário `admin` será criado automaticamente.

---

# Segurança

O sistema utiliza:

* Spring Security
* JWT Authentication
* Controle de acesso por role
* Proteção de endpoints
* Variáveis de ambiente para configurações sensíveis em Docker/EC2

O arquivo `.env` não deve ser versionado. Use `.env.example` como modelo.

---

# Possíveis Melhorias Futuras

* Upload de documentos
* Férias automáticas
* Notificações
* Dashboard analítico
* Integração com SAP SuccessFactors
* HTTPS com domínio próprio na AWS
* Pipeline CI/CD para deploy automático

---

# Licença

Projeto desenvolvido para fins educacionais e demonstração de arquitetura de sistemas corporativos.

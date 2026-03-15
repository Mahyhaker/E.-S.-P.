# HCM System — Human Capital Management

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-green)
![SAP UI5](https://img.shields.io/badge/SAP-UI5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
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

```
SAP UI5 (Frontend)
        ↓
REST API
        ↓
Spring Boot (Backend)
        ↓
PostgreSQL Database
```

---

# Tecnologias Utilizadas

## Backend

* Java 17
* Spring Boot
* Spring Security
* JWT Authentication
* JPA / Hibernate
* Maven

## Frontend

* SAP UI5
* SAP Fiori Design
* JavaScript
* JSONModel

## Banco de Dados

* PostgreSQL

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

```
Employee → Manager
```

---

## Solicitações de Ausência

Fluxo completo:

```
Employee cria solicitação
        ↓
Manager aprova ou rejeita
        ↓
HR visualiza e gerencia
```

---

# Estrutura do Projeto

## Backend

```
src/main/java/com/mahyhaker/hcm

config
 ├─ SecurityConfig
 ├─ JwtAuthenticationFilter
 └─ DataInitializer

controller
 ├─ AuthController
 ├─ EmployeeController
 ├─ UserController
 └─ LeaveRequestController

service
 ├─ EmployeeService
 ├─ UserService
 └─ JwtService

repository
 ├─ EmployeeRepository
 ├─ UserRepository
 ├─ DepartmentRepository
 └─ LeaveRequestRepository

model
 ├─ Employee
 ├─ User
 ├─ Department
 └─ LeaveRequest
```

---

## Frontend

```
webapp

controller
 ├─ Login.controller.js
 ├─ Dashboard.controller.js
 ├─ Main.controller.js
 ├─ Detail.controller.js
 ├─ Departments.controller.js
 ├─ OrgTree.controller.js
 ├─ LeaveRequests.controller.js
 ├─ ManagerApprovals.controller.js
 └─ HrApprovals.controller.js

view
fragments
Component.js
manifest.json
```

---

# Autenticação

O sistema utiliza **JWT (JSON Web Token)**.

Após login o backend retorna:

```
token
username
role
employeeId
```

O token é enviado em todas as requisições:

```
Authorization: Bearer TOKEN
```

---

# Usuário Inicial

Ao iniciar o sistema, um usuário administrador é criado automaticamente.

```
username: admin
password: 123
role: ADMIN
```

---

# Instalação

## 1 Clonar o projeto

```
git clone https://github.com/seuusuario/hcm-system.git
```

---

## 2 Configurar PostgreSQL

Criar banco:

```
CREATE DATABASE hcm;
```

Editar:

```
application.properties
```

```
spring.datasource.url=jdbc:postgresql://localhost:5432/hcm
spring.datasource.username=postgres
spring.datasource.password=senha
```

---

## 3 Rodar o backend

```
mvn spring-boot:run
```

Servidor:

```
http://localhost:8080
```

---

## 4 Rodar o frontend

Com UI5 tooling:

```
ui5 serve
```

Aplicação:

```
http://localhost:8081
```

---

# Reset do Banco (Ambiente de Desenvolvimento)

Para limpar o banco e reiniciar IDs:

```
TRUNCATE TABLE 
    leave_request,
    users,
    employee,
    department
RESTART IDENTITY CASCADE;
```

Após reiniciar o sistema o **admin será criado automaticamente**.

---

# Segurança

O sistema utiliza:

* Spring Security
* JWT Authentication
* Controle de acesso por Role
* Proteção de endpoints

---

# Possíveis Melhorias Futuras

* Upload de documentos
* Férias automáticas
* Notificações
* Dashboard analítico
* Integração com SAP SuccessFactors

---

# Licença

Projeto desenvolvido para fins educacionais e demonstração de arquitetura de sistemas corporativos.

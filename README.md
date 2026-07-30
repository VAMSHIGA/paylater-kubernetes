# PayLater Backend API

A backend PayLater service built using **Go, Gin Framework, MySQL, SQLC, JWT Authentication, and Role-Based Authorization**.

The application supports customer management, merchant management, PayLater transactions, repayments, reporting, authentication, and authorization.

---

## 1. Technologies Used

* Go (Golang)
* Gin Framework
* MySQL
* SQLC
* JWT
* bcrypt
* REST API
* Postman
* AWS EC2
* Amazon RDS MySQL
* Amazon CloudWatch

---

## 2. Project Architecture

The project follows a layered monolithic architecture.

```text
Client / Postman
       |
       v
Routes
       |
       v
Middleware
       |
       v
Handlers
       |
       v
Services
       |
       v
SQLC
       |
       v
MySQL
```

---

## 3. Project Structure

```text
paylater/
│
├── db/
│   ├── db.go
│   ├── schema/
│   │   └── schema.sql
│   ├── queries/
│   │   ├── auth.sql
│   │   ├── customer.sql
│   │   ├── merchant.sql
│   │   ├── transaction.sql
│   │   ├── payback.sql
│   │   └── report.sql
│   └── sqlc/
│
├── handlers/
│   ├── auth.go
│   ├── customer.go
│   ├── merchant.go
│   ├── transaction.go
│   ├── payback.go
│   └── report.go
│
├── services/
│   ├── auth.go
│   ├── customer.go
│   ├── merchant.go
│   ├── transaction.go
│   ├── payback.go
│   └── report.go
│
├── routes/
│   ├── auth.go
│   ├── customer.go
│   ├── merchant.go
│   ├── transaction.go
│   ├── payback.go
│   └── report.go
│
├── middleware/
│   ├── auth.go
│   └── authorization.go
│
├── token/
│   └── jwt.go
│
├── main.go
├── go.mod
├── go.sum
├── sqlc.yaml
└── README.md
```

---

## 4. Database Tables

The application uses the following MySQL tables:

* `users`
* `customers`
* `merchants`
* `transactions`
* `paybacks`

---

## 5. Authentication

JWT is used for authentication.

Users login using:

```text
POST /auth/login
```

After successful login, the API generates a JWT.

The JWT contains:

* User ID
* Email
* Role
* Expiration time

Protected APIs require:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

## 6. Password Security

Passwords are never stored as plain text.

The application uses **bcrypt** for password hashing.

```text
Plain Password
      |
      v
bcrypt
      |
      v
Password Hash
      |
      v
MySQL users.password_hash
```

During login, bcrypt compares the entered password with the stored hash.

---

## 7. JWT Signing

JWT tokens are signed using:

```text
HS256
```

The JWT secret is stored in an environment variable:

```text
JWT_SECRET
```

Secrets and database passwords must not be committed to Git.

---

## 8. Authorization

The application uses role-based authorization.

Current roles:

```text
admin
customer
merchant
```

### Admin

Admin has access to system-level operations.

### Customer

Customers can perform authorized customer operations such as transactions and paybacks.

### Merchant

Merchant authentication is supported. Merchant-specific protected business operations can be added according to business requirements.

---

## 9. Middleware

The application uses the following middleware:

### Gin Logger Middleware

Logs incoming HTTP requests.

### Gin Recovery Middleware

Recovers the server from unexpected panics.

### AuthMiddleware

Validates the JWT.

```text
Request
   |
   v
JWT validation
   |
   +-- Invalid --> 401 Unauthorized
   |
   +-- Valid --> Continue
```

### AuthorizeRoles

Checks whether the authenticated user's role is allowed to access an endpoint.

```text
Authenticated User
       |
       v
Check Role
       |
       +-- Allowed --> Handler
       |
       +-- Not Allowed --> 403 Forbidden
```

---

## 10. API Endpoints

The application currently contains **12 endpoints**.

### Authentication

| Method | Endpoint         | Access |
| ------ | ---------------- | ------ |
| POST   | `/auth/register` | Public |
| POST   | `/auth/login`    | Public |

Public registration is intended for customer and merchant accounts. Admin accounts should not be created through unrestricted public registration.

### Customer

| Method | Endpoint     | Access |
| ------ | ------------ | ------ |
| POST   | `/customers` | Admin  |
| GET    | `/customers` | Admin  |

### Merchant

| Method | Endpoint         | Access |
| ------ | ---------------- | ------ |
| POST   | `/merchants`     | Admin  |
| PUT    | `/merchants/:id` | Admin  |

### Transaction

| Method | Endpoint        | Access          |
| ------ | --------------- | --------------- |
| POST   | `/transactions` | Admin, Customer |

### Payback

| Method | Endpoint    | Access          |
| ------ | ----------- | --------------- |
| POST   | `/paybacks` | Admin, Customer |

### Reports

| Method | Endpoint                 | Access |
| ------ | ------------------------ | ------ |
| GET    | `/reports/merchant-fees` | Admin  |
| GET    | `/reports/customer-dues` | Admin  |
| GET    | `/reports/credit-limit`  | Admin  |
| GET    | `/reports/total-dues`    | Admin  |

---

## 11. Authentication Flow

```text
User
 |
 v
POST /auth/login
 |
 v
Check email
 |
 v
Get user from MySQL
 |
 v
bcrypt password verification
 |
 v
Generate JWT
 |
 v
Return JWT
```

---

## 12. Protected API Flow

```text
Client
 |
 | Bearer JWT
 v
AuthMiddleware
 |
 | JWT Valid
 v
AuthorizeRoles
 |
 | Role Allowed
 v
Handler
 |
 v
Service
 |
 v
SQLC
 |
 v
MySQL
```

---

## 13. Environment Variables

Create a `.env` file.

Example:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_NAME=<database-name>

JWT_SECRET=<strong-random-secret>
```

Do not commit `.env` to Git.

Add it to `.gitignore`:

```text
.env
```

---

## 14. Run the Application

Install dependencies:

```bash
go mod tidy
```

Build:

```bash
go build ./...
```

Run:

```bash
go run .
```

The application runs on:

```text
http://localhost:8080
```

---

## 15. Testing

Postman can be used to test the REST APIs.

For protected APIs:

1. Login using `/auth/login`.
2. Copy the returned JWT.
3. Select **Bearer Token** in Postman.
4. Paste the JWT.
5. Call the required protected endpoint.

---

## 16. HTTP Security Responses

```text
200 OK
Request successful

201 Created
Resource successfully created

400 Bad Request
Invalid request data

401 Unauthorized
JWT is missing, invalid, or expired

403 Forbidden
User is authenticated but does not have permission

500 Internal Server Error
Server/database error
```

---

## 17. AWS Deployment

The application is intended to use:

```text
Postman / Client
       |
       v
Amazon EC2
Go + Gin API
       |
       v
Amazon RDS
MySQL
```

Application logs will be sent to:

```text
Amazon CloudWatch
```

### AWS Components

* **Amazon EC2** — hosts the Go PayLater API.
* **Amazon RDS MySQL** — stores application data.
* **Amazon CloudWatch** — collects and monitors application/server logs.

---

## 18. Security

* Passwords are hashed using bcrypt.
* JWT is used for authentication.
* HS256 is used for JWT signing.
* Role-based authorization controls API access.
* Secrets are stored using environment variables.
* `.env` must not be committed to Git.
* Admin registration is not exposed through unrestricted public registration.
* Protected APIs require a valid Bearer JWT.

---

## 19. Main Modules

The PayLater backend currently contains:

```text
Authentication
Customer
Merchant
Transaction
Payback
Reports
```

The application currently provides **12 REST API endpoints**.

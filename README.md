# PayLater Backend

A PayLater backend REST API built using Go, Gin Framework, MySQL, and SQLC.

The application manages customers, merchants, transactions, repayments, and reports.

## Technologies Used

- Go
- Gin Framework
- MySQL
- SQLC
- REST API
- Postman

## Project Structure

paylater/
├── db/
│   ├── queries/
│   └── sqlc/
├── handlers/
├── routes/
├── services/
├── main.go
├── go.mod
├── go.sum
└── README.md

## Architecture

The project follows this flow:

Client / Postman
        ↓
Routes
        ↓
Handlers
        ↓
Services
        ↓
SQLC
        ↓
MySQL Database

## Modules

### 1. Customer

Customer CRUD operations.

- POST `/customers`
- GET `/customers`
- GET `/customers/:id`
- PUT `/customers/:id`
- DELETE `/customers/:id`

### 2. Merchant

Merchant CRUD operations.

- POST `/merchants`
- GET `/merchants`
- GET `/merchants/:id`
- PUT `/merchants/:id`
- DELETE `/merchants/:id`

### 3. Transaction

Handles PayLater transactions between customers and merchants.

- POST `/transactions`
- GET `/transactions`
- GET `/transactions/:id`
- PUT `/transactions/:id`
- DELETE `/transactions/:id`

### 4. Payback

Handles customer repayments.

- POST `/paybacks`
- GET `/paybacks`
- GET `/paybacks/:id`
- DELETE `/paybacks/:id`

### 5. Reports

Provides PayLater reporting information.

- GET `/reports/merchant-fees`
- GET `/reports/customer-dues`
- GET `/reports/credit-limit`
- GET `/reports/total-dues`

## Total Endpoints

The application currently contains 23 REST API endpoints.

## Customer Due Calculation

Customer remaining due is calculated using:

Remaining Due = Total Transactions - Total Paybacks

Example:

Total Transaction = 5000.00
Total Repaid      = 5000.00
Remaining Due     = 0.00

## Database Tables

The application uses these main tables:

- customers
- merchants
- transactions
- paybacks

## Run the Application

From the project directory:

```bash
go run .vamshi@DESKTOP...



## Run the Application

From the project directory:

```bash
go run .
```

The server runs at:

`http://localhost:8080`

## Generate SQLC Code

After changing SQL queries, run:

```bash
sqlc generate
```

Do not manually edit generated files inside `db/sqlc`.

## Current Status

- Customer Module - Completed
- Merchant Module - Completed
- Transaction Module - Completed
- Payback Module - Completed
- Reports Module - Completed

## Future Improvements

- Request validation
- Credit-limit validation
- Payback amount validation
- Better error handling
- Authentication with JWT
- Unit testing
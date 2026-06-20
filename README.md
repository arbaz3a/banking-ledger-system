# Bank Backend

A robust banking ledger backend system built with Node.js, Express, and MongoDB. It features a double-entry accounting system, secure transactions, and idempotency handling.

## Features

- **Double-Entry Accounting:** Ensures financial integrity where every transaction creates corresponding credit and debit ledger entries.
- **Dynamic Balances:** Balances are calculated dynamically via aggregation at runtime to prevent synchronization issues.
- **Idempotent Transactions:** Prevents accidental double charges on network retries.
- **Concurrency Handling:** Uses MongoDB sessions to guarantee ACID properties during fund transfers.
- **Authentication:** Secure user authentication using JWT and bcrypt.
- **Email Notifications:** Automated transaction alerts to sender and receiver via Nodemailer.

## Prerequisites

Before running this project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas account)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory and configure the following required variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Email configuration for nodemailer (e.g., Google OAuth)
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_google_refresh_token
EMAIL_USER=your_email@gmail.com
```

### 3. Run the application
Start the server using the start script (which runs nodemon):
```bash
npm start
```
The server will start running on `http://localhost:3000`.

## Technology Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- nodemailer for email notifications

## Folder Structure

```text
bankbackend/
├── .env                  # Environment variables configuration
├── package.json          # Project dependencies and scripts
├── server.js             # Application entry point
└── src/                  # Source code
    ├── app.js            # Express app setup and middleware
    ├── config/           # Database and other configurations
    ├── controllers/      # Route handlers and business logic
    ├── middleware/       # Custom Express middleware
    ├── models/           # Mongoose database schemas
    ├── routes/           # API route definitions
    └── services/         # External services (e.g., email service)
```

## Database Schema

The database relies on a double-entry ledger system to ensure high data integrity.

### User
Stores user information and credentials.
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `systemUser` (Boolean, for internal system operations)

### Account
Represents a bank account linked to a user. Balances are dynamically calculated via aggregation, not stored as a static field.
- `user` (ObjectId, reference to User)
- `status` (String: ACTIVE, FROZEN, CLOSED)
- `currency` (String)

### Transaction
Records the intent and status of a fund transfer between accounts.
- `fromAccount` (ObjectId, reference to Account)
- `toAccount` (ObjectId, reference to Account)
- `amount` (Number)
- `status` (String: PENDING, COMPLETED, FAILED, REVERSED)
- `idempotencyKey` (String, unique, prevents duplicate or double-charge transactions)

### Ledger
Immutable records of credits and debits. This acts as the absolute source of truth for all account balances.
- `account` (ObjectId, reference to Account)
- `amount` (Number)
- `transaction` (ObjectId, reference to Transaction)
- `type` (String: CREDIT, DEBIT)

## Code Flow: Transaction Processing

The fund transfer system is designed to handle race conditions and ensure ACID properties using MongoDB transaction sessions. The 10-step flow is as follows:

1. **Validation**: Validates request parameters and verifies the accounts exist.
2. **Account Status Check**: Ensures both sender and receiver accounts are `ACTIVE`.
3. **Balance Derivation**: Calculates the sender's current balance by aggregating all their past `CREDIT` and `DEBIT` ledger entries.
4. **Idempotency and Concurrency**: Creates the transaction record with a `PENDING` state and a unique `idempotencyKey` outside of the session. This prevents duplicate charges in case of network retries or race conditions.
5. **Session Start**: Initiates a MongoDB session to ensure atomicity.
6. **Debit Creation**: Creates a `DEBIT` ledger entry for the sender within the session.
7. **Credit Creation**: Creates a `CREDIT` ledger entry for the receiver within the session.
8. **Mark Completed**: Updates the transaction status to `COMPLETED` within the session.
9. **Commit**: Commits the MongoDB session, saving all changes permanently. If any error occurs, the session is aborted, rolling back changes, and the transaction is marked as `FAILED`.
10. **Notifications**: Dispatches email alerts to both the sender and receiver confirming the transfer.

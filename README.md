# Bank Backend

A robust banking ledger backend system built with Node.js, Express, and MongoDB. It features a double-entry accounting system, secure transactions, and idempotency handling.

## Technology Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- nodemailer for email notifications

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

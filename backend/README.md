# AyurTrace Backend API

## Overview
AyurTrace is an Ayurvedic Herb Traceability Platform designed to track an herb's journey from harvest to consumer, ensuring transparency via a scannable QR code. This backend API provides the necessary endpoints for managing users, herb batches, and tracking the provenance chain.

## Folder Structure
```
backend/
├── config/
│   └── db.js                  # Database connection configuration
├── controllers/
│   ├── batchController.js     # Herb batch operations
│   └── userController.js      # User authentication and management
├── middlewares/
│   ├── authMiddleware.js      # JWT authentication middleware
│   ├── errorMiddleware.js     # Error handling middleware
│   └── roleMiddleware.js      # Role-based access control
├── models/
│   ├── HerbBatch.js           # Herb batch schema
│   └── User.js                # User schema
├── routes/
│   ├── batchRoutes.js         # Herb batch API routes
│   └── userRoutes.js          # User API routes
├── uploads/                   # Storage for uploaded images
│   └── qrcodes/               # Generated QR codes
├── utils/
│   ├── fileUpload.js          # Multer configuration for file uploads
│   ├── qrCodeGenerator.js     # QR code generation utility
│   └── responseFormatter.js   # Standardized API response formatter
├── .env                       # Environment variables
├── package.json               # Project dependencies
└── server.js                  # Express server configuration
```

## API Endpoints

### Authentication

| Method | Route | Protection | Description |
|--------|-------|------------|-------------|
| POST | /api/users/register | Public | Register a new user |
| POST | /api/users/login | Public | Login a user and get token |
| GET | /api/users/profile | Protected | Get user profile |
| PUT | /api/users/profile | Protected | Update user profile |
| GET | /api/users | Admin | Get all users |
| DELETE | /api/users/:id | Admin | Delete a user |

### Herb Batches

| Method | Route | Protection | Description |
|--------|-------|------------|-------------|
| POST | /api/batches | Farmer | Create a new herb batch with geotagged image |
| GET | /api/batches | Admin | Get all batches with pagination |
| GET | /api/batches/:batchId | Public | Get a single batch by ID with full provenance history |
| PUT | /api/batches/:batchId/add-event | Supply Chain Participant | Add a new event to the provenance chain with optional geotagged image |
| GET | /api/batches/my/owned | Protected | Get batches owned by the logged-in user |
| GET | /api/batches/my/farmed | Farmer | Get batches created by the logged-in farmer |

### GPS Tracking

| Method | Route | Protection | Description |
|--------|-------|------------|-------------|
| PUT | /api/gps/:batchId/update | Distributor | Update real-time GPS location for a batch in transit |
| GET | /api/gps/:batchId | Protected | Get current GPS location for a batch in transit |

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```
4. Create the uploads directory:
   ```
   mkdir -p uploads/qrcodes
   ```
5. Start the server:
   ```
   npm run dev
   ```

## NPM Commands

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with nodemon

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "status": "success",
  "statusCode": 200,
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "stack": "Error stack trace (development only)"
}
```
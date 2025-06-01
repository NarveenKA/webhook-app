# Data Pusher - Express Web Application

## Overview

Data Pusher is an Express web application that receives data for accounts and distributes it across multiple destination platforms using webhook URLs. The application serves as a data routing service that authenticates incoming requests and forwards data to configured destinations based on account settings.

## Features

- **Account Management**: Create and manage accounts with unique identifiers and auto-generated secret tokens
- **Destination Management**: Configure multiple webhook destinations per account with custom headers and HTTP methods
- **Data Routing**: Receive JSON data and automatically distribute it to all configured destinations for an account
- **Authentication**: Secure data ingestion using app secret tokens
- **Flexible HTTP Methods**: Support for GET, POST, and PUT methods with appropriate data formatting

## Architecture

The application is built with three main modules:

1. **Account Module**: Manages account creation, authentication, and account-specific configurations
2. **Destination Module**: Handles webhook destination configurations for each account
3. **Data Handler Module**: Processes incoming data and distributes it to configured destinations

## Technology Stack

- **Runtime**: Node.js (Latest Version)
- **Framework**: Express.js
- **Database**: SQLite
- **HTTP Client**: Axios/Node-fetch for webhook requests
- **Authentication**: Custom token-based authentication

## Installation

### Prerequisites

- Node.js (Latest LTS version)
- npm or yarn package manager

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd webhook-app
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
node scripts/init_db.js
```

4. Start the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

## Database Schema

### Accounts Table
- `id` (Primary Key, Auto-increment)
- `account_id` (Unique identifier)
- `account_name` (Required)
- `email` (Required, Unique)
- `app_secret_token` (Auto-generated)
- `website` (Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Destinations Table
- `id` (Primary Key, Auto-increment)
- `account_id` (Foreign Key)
- `url` (Required)
- `http_method` (Required: GET, POST, PUT)
- `headers` (JSON format)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## API Endpoints

### Account Management

#### Create Account
```http
POST /api/accounts
Content-Type: application/json

{
  "account_name": "Example Account",
  "email": "user@example.com",
  "website": "https://example.com" // optional
}
```

#### Get All Accounts
```http
GET /api/accounts
```

#### Get Account by ID
```http
GET /api/accounts/:accountId
```

#### Update Account
```http
PUT /api/accounts/:accountId
Content-Type: application/json

{
  "account_name": "Updated Account Name",
  "email": "updated@example.com",
  "website": "https://updated-example.com"
}
```

#### Delete Account
```http
DELETE /api/accounts/:accountId
```

### Destination Management

#### Create Destination
```http
POST /api/destinations
Content-Type: application/json

{
  "account_id": "acc_123456",
  "url": "https://webhook.example.com/endpoint",
  "http_method": "POST",
  "headers": {
    "APP_ID": "1234APPID1234",
    "APP_SECRET": "enwdj3bshwer43bjhjs9ereuinkjcnsiurew8s",
    "ACTION": "user.update",
    "Content-Type": "application/json",
    "Accept": "*/*"
  }
}
```

#### Get All Destinations
```http
GET /api/destinations
```

#### Get Destinations by Account ID
```http
GET /api/destinations/account/:accountId
```

#### Get Destination by ID
```http
GET /api/destinations/:destinationId
```

#### Update Destination
```http
PUT /api/destinations/:destinationId
Content-Type: application/json

{
  "url": "https://updated-webhook.example.com/endpoint",
  "http_method": "PUT",
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  }
}
```

#### Delete Destination
```http
DELETE /api/destinations/:destinationId
```

### Data Ingestion

#### Receive and Forward Data
```http
POST /server/incoming_data
Content-Type: application/json
CL-X-TOKEN: <app_secret_token>

{
  "user_id": "12345",
  "event": "user_update",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Data Flow

1. **Data Reception**: POST request received at `/server/incoming_data`
2. **Authentication**: Validate `CL-X-TOKEN` header against stored app secret tokens
3. **Account Identification**: Match secret token to corresponding account
4. **Destination Lookup**: Retrieve all destinations configured for the account
5. **Data Distribution**: Forward data to each destination using configured HTTP method and headers

### HTTP Method Handling

- **GET Requests**: JSON data converted to query parameters
- **POST/PUT Requests**: JSON data sent in request body as-is

## Error Handling

The application returns appropriate HTTP status codes and JSON error responses:

- `400 Bad Request`: Invalid data format or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side errors

### Common Error Responses

```json
{
  "error": "Invalid Data",
  "message": "Request must contain valid JSON data"
}
```

```json
{
  "error": "Un Authenticate",
  "message": "Missing or invalid CL-X-TOKEN header"
}
```

## Development


### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

### Database Management

Initialize database:
```bash
node scripts/init_db.js
```

Reset database:
```bash
rm db/dev.sqlite3
```

## Security Considerations

- App secret tokens are automatically generated using cryptographically secure methods
- Input validation on all API endpoints
- SQL injection protection through parameterized queries
- Rate limiting on data ingestion endpoints (recommended for production)

## Performance

- Connection pooling for database operations
- Async/await pattern for non-blocking operations
- Error logging and monitoring integration points
- Webhook timeout handling and retry mechanisms

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This application was developed as part of the NodeJS Developer Assessment for CustomerLabs.
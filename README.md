# Secure Note API

A RESTful API built with FastAPI that allows users to create, read, update, and delete secure notes with robust security features.

## Features

- **User Authentication**: JWT-based authentication system with bcrypt password hashing
- **Data Encryption**: Optional end-to-end encryption for note content using Fernet symmetric encryption
- **Security Headers**: CSP, XSS protection, and other security headers implemented
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **CORS Protection**: Configurable Cross-Origin Resource Sharing settings
- **reCAPTCHA Integration**: Protection against automated attacks
- **Sensitivity Analysis**: Automatic detection of potentially sensitive information

## API Endpoints

The API follows a RESTful architecture with all endpoints prefixed with `/api/v1`.

### Authentication

- `POST /auth/login` - Authenticate and receive JWT token

### User Management

- `POST /users` - Create new user account
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `DELETE /users/me` - Delete user account

### Secure Notes

- `GET /notes` - List all notes for current user
- `POST /notes` - Create a new note (with optional encryption)
- `GET /notes/{note_id}` - Retrieve a specific note
- `PUT /notes/{note_id}` - Update a note
- `DELETE /notes/{note_id}` - Delete a note
- `POST /notes/{note_id}/recreate` - Recreate a note with different encryption settings

## Installation

### Prerequisites

- Python 3.8+
- Redis
- pip (Python package manager)

### Setup

1. Clone the repository:
   ```bash
   https://github.com/guls4h/secure-note-api-ai-supported.git
   cd secure-note-api
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On Unix or MacOS
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your configuration:
   ```
   # App settings
   APP_ENV=development
   SECRET_KEY=your_secret_key_here
   APP_NAME="Secure Note API"
   
   # JWT settings
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   JWT_ALGORITHM=HS256
   
   # Redis settings
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # CORS settings
   CORS_ORIGINS=http://localhost:3000
   
   # ReCAPTCHA settings (optional)
   RECAPTCHA_ENABLED=false
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   
   # Rate limiting
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_SECONDS=60
   ```

5. Start the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## Usage

### Authentication Flow

1. Register a new user:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/users" \
     -H "Content-Type: application/json" \
     -d '{"username": "user1", "password": "securepassword", "email": "user@example.com"}'
   ```

2. Login to get an access token:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=user1&password=securepassword"
   ```

3. Use the token for authenticated requests:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/users/me" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

### Managing Secure Notes

1. Create a new unencrypted note:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/notes" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "My Note", "content": "This is an unencrypted note"}'
   ```

2. Create an encrypted note:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/notes" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "My Secret Note", "content": "This is encrypted", "encrypted": true, "encryption_password": "notepassword"}'
   ```

3. Retrieve an encrypted note:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/notes/note_id?encryption_password=notepassword" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Security Considerations

- Always use HTTPS in production
- Configure a proper reverse proxy with additional security headers
- Regularly rotate JWT secret keys
- Secure Redis with strong passwords and network restrictions
- Enable reCAPTCHA in production environments

## Documentation

- API documentation is available at `/docs` when the server is running
- Detailed security documentation can be found in [DOCUMENTATION.md](DOCUMENTATION.md)

## License

[MIT License](LICENSE) 

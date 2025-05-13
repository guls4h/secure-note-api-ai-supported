# Secure Note API - Security Documentation

## Overview
The Secure Note API is a RESTful service built with FastAPI that allows users to create, read, update, and delete secure notes. The application features robust security measures including user authentication, data encryption, rate limiting, and protection against common web vulnerabilities.

## API Endpoints

The API follows a RESTful architecture with endpoints organized by resource type. All endpoints are prefixed with `/api/v1`.

### Authentication Endpoints

| Endpoint | Method | Description | Security Features |
|----------|--------|-------------|-------------------|
| `/auth/login` | POST | Authenticates a user and returns a JWT token | - Password verification<br>- reCAPTCHA verification<br>- Rate limiting |

### User Management Endpoints

| Endpoint | Method | Description | Security Features |
|----------|--------|-------------|-------------------|
| `/users` | POST | Creates a new user account | - Password hashing<br>- reCAPTCHA verification<br>- Email validation |
| `/users/me` | GET | Returns the current user's profile | - JWT authentication<br>- Rate limiting |
| `/users/me` | PUT | Updates the current user's profile | - JWT authentication<br>- Input validation |
| `/users/me` | DELETE | Deletes the current user's account | - JWT authentication |

### Secure Notes Endpoints

| Endpoint | Method | Description | Security Features |
|----------|--------|-------------|-------------------|
| `/notes` | GET | Retrieves all notes for the current user | - JWT authentication<br>- Pagination |
| `/notes` | POST | Creates a new note | - JWT authentication<br>- Optional encryption<br>- Input validation |
| `/notes/{note_id}` | GET | Retrieves a specific note | - JWT authentication<br>- Owner verification<br>- Decryption capability |
| `/notes/{note_id}` | PUT | Updates a specific note | - JWT authentication<br>- Owner verification<br>- Encryption management |
| `/notes/{note_id}` | DELETE | Deletes a specific note | - JWT authentication<br>- Owner verification |
| `/notes/{note_id}/recreate` | POST | Recreates a note with different encryption | - JWT authentication<br>- Owner verification<br>- Encryption transition |

### Application Health

| Endpoint | Method | Description | Security Features |
|----------|--------|-------------|-------------------|
| `/` | GET | Health check endpoint | - Basic availability check |

## Endpoint Security Details

### Authentication Flow

1. **User Login** (`POST /auth/login`):
   - Accepts username and password via OAuth2 password flow
   - Verifies reCAPTCHA token if enabled
   - Validates credentials against stored hashed passwords
   - Returns a JWT token with configurable expiration (default 30 minutes)
   - Rate limited to prevent brute force attacks

### User Management

1. **User Registration** (`POST /users`):
   - Validates and sanitizes input data
   - Requires reCAPTCHA verification
   - Hashes password using bcrypt before storage
   - Prevents duplicate usernames
   - Returns the created user object (without password)

2. **User Profile** (`GET /users/me`):
   - Requires valid JWT token
   - Returns user profile without sensitive data

3. **Profile Update** (`PUT /users/me`):
   - Validates input data
   - Re-hashes password if changed
   - Updates only allowed fields

4. **Account Deletion** (`DELETE /users/me`):
   - Permanently removes user account and associated data
   - Requires authentication

### Secure Notes Management

1. **Note Creation** (`POST /notes`):
   - Associates note with authenticated user
   - Supports optional encryption with user-provided password
   - When encryption is enabled:
     - Generates a unique salt
     - Derives encryption key from password and salt
     - Encrypts content using Fernet symmetric encryption
     - Stores encrypted content and salt (not the password)
   - Performs sensitivity analysis on content

2. **Note Retrieval** (`GET /notes/{note_id}`):
   - Verifies user owns the requested note
   - For encrypted notes:
     - Requires decryption password as query parameter
     - Retrieves salt and encrypted content
     - Derives key using provided password and stored salt
     - Attempts to decrypt content
     - Returns error if wrong password is provided
   - For unencrypted notes, returns content directly

3. **Note Update** (`PUT /notes/{note_id}`):
   - Verifies user owns the note
   - Supports changing encryption status:
     - Unencrypted to encrypted (requires new password)
     - Encrypted to unencrypted (removes encryption)
     - Change encryption password (requires old and new passwords)
   - Performs sensitivity analysis on updated content

4. **Note Re-encryption** (`POST /notes/{note_id}/recreate`):
   - Creates a new note with the same content but different encryption settings
   - Useful for securely changing encryption passwords
   - Can optionally delete the original note after successful recreation

## Security Features

### Authentication
- **JWT Token Authentication**: The application uses JSON Web Tokens (JWT) for authentication.
- **Password Hashing**: User passwords are securely hashed using bcrypt through the `passlib` library.
- **Token Expiration**: Access tokens expire after a configurable time period (default 30 minutes).
- **OAuth2 Implementation**: Authentication follows the OAuth2 password flow standard.

#### Authentication Flow
1. The user submits their username and password to the `/api/v1/auth/login` endpoint.
2. The server verifies reCAPTCHA if enabled.
3. The server validates the user's credentials against stored hashed passwords.
4. Upon successful authentication, the server returns a JWT token with an expiration time.
5. This token must be included in the Authorization header for subsequent requests.

#### JWT Token Handling and Logout Mechanism

Since JWT tokens are stateless by design and don't have a built-in revocation mechanism, the application implements a client-side logout strategy:

1. **Token Storage**: 
   - The frontend stores authentication tokens in two places for redundancy:
     - Browser's localStorage
     - HTTP-only cookies

2. **Logout Implementation**:
   - When a user clicks "Sign out" in the UI, the application:
     - Removes the token from localStorage
     - Deletes the access_token cookie (using both js-cookie library and vanilla JavaScript as a fallback)
     - Resets the authentication state in the React context
     - Redirects the user to the login page

3. **Token Expiration**:
   - The backend issues tokens with a configured expiration time (default 30 minutes)
   - Once expired, tokens are automatically rejected by the server
   - The frontend has no token refresh mechanism, requiring users to log in again after expiration

4. **Security Considerations**:
   - The application relies on short token lifetimes (30 minutes) to mitigate the risk of token theft
   - The client-side logout doesn't invalidate the token on the server, meaning a stolen token remains valid until expiration
   - For security-critical operations (like account deletion), the frontend makes an effort to blacklist the token but this mechanism is not guaranteed

5. **Session Invalidation**:
   - The frontend provides an `invalidateSession` function that:
     - Removes tokens from all storage mechanisms
     - Clears browser cache
     - Forces a full page reload to clear memory
     - Redirects to the login page

This approach provides a practical balance between security and simplicity, trading off the complexity of server-side token validation for a streamlined authentication flow.

### Encryption
The application uses a robust encryption system to secure note content:

#### Encryption Implementation
- **Algorithm**: The application uses the Fernet symmetric encryption from the `cryptography` library.
- **Key Derivation**: PBKDF2HMAC with SHA-256 is used to derive encryption keys from user passwords.
- **Salt**: A unique random salt (16 bytes) is generated for each encrypted note and stored with the note.
- **Iterations**: 100,000 iterations are used in the key derivation function, providing strong protection against brute force attacks.

#### Encryption Process
1. When a user enables encryption for a note:
   - A random salt is generated.
   - The salt and password are used to derive an encryption key.
   - The note content is encrypted using the key.
   - The encrypted content and salt (not the password) are stored in the database.
2. When decrypting:
   - The system retrieves the salt stored with the note.
   - The same derivation process generates an identical key using the provided password and stored salt.
   - The content is decrypted only if the correct password is provided.

### CORS (Cross-Origin Resource Sharing)
- **Origin Restriction**: In production mode, the API restricts which origins can make requests.
- **Configurable Settings**: CORS origins, methods, and headers are fully configurable via environment variables.
- **Credentials Support**: The API can be configured to allow or disallow credentials in cross-origin requests.

### CSP (Content Security Policy)
The application implements a comprehensive Content Security Policy through the `SecurityHeadersMiddleware`:

- **Default Policy**: Restricts content sources to same origin with specific exceptions for trusted sources.
- **Script Sources**: Controls which domains can serve JavaScript to the application.
- **Style Sources**: Limits where CSS can be loaded from.
- **Connect Sources**: Restricts which URLs the application can connect to.
- **Frame Sources**: Limits which sites can embed the application in an iframe.

The default policy in the application is:
```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google.com https://www.gstatic.com; font-src 'self' data:; connect-src 'self' http://localhost:8000 https://www.google.com; frame-src 'self' https://www.google.com
```

### XSS (Cross-Site Scripting) Protection
The application employs multiple layers of protection against XSS:

- **X-XSS-Protection Header**: Forces browsers to block detected XSS attacks with `X-XSS-Protection: 1; mode=block`.
- **Content Security Policy**: Limits which scripts can run and from where.
- **X-Content-Type-Options**: Prevents MIME type sniffing with `nosniff` setting.
- **Input Validation**: Uses Pydantic models to validate all input data.

### Rate Limiting
The application includes a Redis-based rate limiter that:

- Restricts the number of requests from a single IP address within a time window.
- Configurable limits (default: 100 requests per minute).
- Returns proper 429 status codes with Retry-After headers when limits are exceeded.
- Exempts documentation endpoints to facilitate API exploration.

### Security Headers
Additional security headers implemented in the application:

- **X-Frame-Options**: Prevents clickjacking by setting `DENY` for framing.
- **Strict-Transport-Security**: Enforces HTTPS connections.
- **Referrer-Policy**: Controls the amount of referrer information shared when navigating.
- **Permissions-Policy**: Restricts which browser features the application can use.

### reCAPTCHA Integration
The login endpoint supports Google reCAPTCHA v2 verification to prevent automated login attempts:

- Configurable via environment variables.
- Can be enabled/disabled based on deployment needs.
- Verifies tokens server-side for maximum security.

## Sensitive Data Handling
The application includes a sensitivity analyzer for note content:

- Automatically scans note content for potentially sensitive information.
- Provides sensitivity scores and explanations.
- Helps users identify when they might be storing sensitive data.

## Secure Redis Implementation
The application uses Redis for data storage with:

- Support for password authentication.
- Configurable connection parameters.
- Proper connection lifecycle management.

## Best Practices
The application follows these security best practices:

1. **Environment-based Configuration**: Sensitive configuration is loaded from environment variables.
2. **Graceful Error Handling**: Security-related errors provide minimal information to prevent information leakage.
3. **Principle of Least Privilege**: API endpoints require appropriate authentication for access.
4. **Secure Defaults**: Security features are enabled by default.

## Data Storage
- User data and notes are stored in Redis.
- Passwords are never stored in plaintext, only securely hashed.
- Encrypted note content is stored with its salt, but not the encryption password.

## Recommendations for Deployment
1. Always use HTTPS in production.
2. Implement a proper reverse proxy (like Nginx) with additional security headers.
3. Regularly rotate JWT secret keys.
4. Configure restrictive CORS settings for production.
5. Enable reCAPTCHA in production.
6. Secure Redis with strong passwords and network restrictions. 
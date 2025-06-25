# User Authentication and Management Documentation

## Overview

This document provides a comprehensive explanation of the authentication and user management systems implemented in the NestJS authentication service. The authentication system supports multiple authentication strategies including:

- Local email/password authentication
- JWT-based session management
- Google OAuth integration
- Refresh token flow for extended sessions

## Architecture

The authentication and user management functionalities are split across two primary modules:

1. **Auth Module**: Handles authentication flows, token generation/validation, and security features
2. **Users Module**: Manages user data, profile operations, and user lifecycle

## Database Schema

Users are stored in PostgreSQL using the Drizzle ORM with the following schema:

```typescript
// User table definition
export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    refreshToken: text('refresh_token'),
    role: userRoleEnum('role').default(UserRole.USER).notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
)
```

## Authentication Strategies

### Local Email-Password Authentication (LocalEmailStrategy)

Allows users to authenticate using their email address and password.

1. Strategy setup in `local.strategy.ts`:
   - Uses Passport's local strategy with email as the username field
   - Validates credentials via AuthService

2. Flow:
   - User submits email/password to `/auth/login` endpoint
   - LocalEmailStrategy validates credentials
   - If valid, JWT tokens are generated and set as cookies

### JWT Authentication (UserEmailJwtStrategy)

Protects routes by validating JWT access tokens provided in cookies.

1. Strategy setup in `user-email-jwt.strategy.ts`:
   - Extracts JWT from 'Authentication' cookie
   - Validates the token using the JWT secret
   - Retrieves the full user profile based on the user ID in the token payload

2. Flow:
   - Protected routes are guarded by UserEmailJwtAuthGuard
   - Guard uses UserEmailJwtStrategy to validate the token
   - If valid, request proceeds with the user object attached

### JWT Refresh Token (JwtRefreshStrategy)

Enables session renewal without requiring the user to log in again.

1. Strategy setup in `jwt-refresh.strategy.ts`:
   - Extracts JWT from 'Refresh' cookie
   - Validates using the refresh token secret
   - Verifies the refresh token matches what's stored in the database

2. Flow:
   - User requests token refresh at `/auth/refresh` endpoint
   - JwtRefreshStrategy validates the refresh token
   - If valid, new access and refresh tokens are generated

### Google OAuth (GoogleStrategy)

Allows users to authenticate using their Google account.

1. Strategy setup in `google.strategy.ts`:
   - Configures Google OAuth with client ID, secret, and callback URL
   - Requests profile and email scopes
   - On successful authentication, creates or retrieves the corresponding user

2. Detailed OAuth Flow:
   - Step 1: Frontend initiates authentication by calling backend's `/auth/google/login` endpoint
   - Step 2: Backend redirects the user to Google's authentication page
   - Step 3: User completes Google login and grants necessary permissions
   - Step 4: Google validates the authentication and redirects back to backend's configured callback URL (`/auth/google/callback`)
   - Step 5: Backend processes the callback, generates a JWT token, and redirects to frontend with the token (typically as a URL parameter)
   - Step 6: Frontend extracts the JWT token and uses it to call backend's `/auth/complete-oauth` endpoint to establish the authenticated session
   - Step 7: Backend validates the JWT token and sets the appropriate authentication cookies

3. Implementation Notes:
   - The frontend must handle the redirect from Google with the token parameter
   - The backend's `/auth/complete-oauth` endpoint should verify the OAuth JWT and establish standard session cookies
   - This flow enables seamless authentication while maintaining separation between frontend and backend

     4. Visual Flow Representation:
        ```
        Frontend                 Backend                  Google
           │                        │                        │
           │                        │                        │
           │     1. Call /auth      │                        │
           │     /google/login      │                        │
           │────────────────────────►                        │
           │                        │                        │
           │                        │     2. Redirect to     │
           │                        │     Google Auth        │
           │                        │────────────────────────►
           │                        │                        │
           │                        │                        │     
           │                        │                        │────┐ 
           │                        │                        │    │ 3. User logs
           │                        │                        │    │    in with
           │                        │                        │◄───┘    Google 
           │                        │                        │     
           │                        │◄────────────────────────
           │                        │   4. Google confirms   │
           │                        │   auth & callback      │
           │                        │                        │
           │                        │                        │
           │   5. Redirect with     │                        │
           │       JWT token        │                        │
           │◄────────────────────────                        │
           │                        │                        │
           │                        │                        │
           │  6. Call /auth/        │                        │
           │  complete-oauth        │                        │
           │  with JWT              │                        │
           │────────────────────────►                        │
           │                        │                        │
           │                        │                        │
           │   7. Authenticated     │                        │
           │   session established  │                        │
           │◄────────────────────────                        │
           │                        │                        │
           ▼                        ▼                        ▼
        ```

## Token Management

The authentication system uses two types of tokens:

1. **Access Token**: Short-lived JWT for API authentication
   - Stored in 'Authentication' cookie
   - Used to protect API routes
   - Default expiration: 15 minutes (configurable)

2. **Refresh Token**: Long-lived JWT for obtaining new access tokens
   - Stored in 'Refresh' cookie and the database
   - Used only for refreshing the access token
   - Default expiration: 7 days (configurable)

## User Registration and Verification

1. **Registration Flow**:
   - User submits email/password to `/users` endpoint
   - User is created with `isActive: false`
   - Verification email is sent with a token
   - User must verify email before account becomes active

2. **Email Verification**:
   - User clicks verification link in email
   - Token is validated against stored tokens
   - If valid, user's `isActive` is set to true
   - User can now log in to the system

## Security Features

### Password Management

- Passwords are hashed using bcrypt before storage
- Password strength validation using class-validator

### Account Protection

- CSRF protection via sameSite cookie policies
- **Recommended Improvements:**
  - Implement rate limiting on authentication endpoints using `@nestjs/throttler`
  - Add account locking after multiple failed attempts

### Password Reset

1. **Forgot Password Flow**:
   - User requests password reset via `/auth/forgot-password` endpoint
   - Reset token is generated and stored in memory
   - Email with reset link is sent to the user
   - Token expires after 1 hour (configurable)

2. **Reset Password Flow**:
   - User submits new password and token to `/auth/reset-password` endpoint
   - Token is validated against stored tokens
   - If valid, password is updated and tokens are cleared

## Role-Based Access Control

The system implements role-based access control with three predefined roles:

- `USER`: Regular user with basic permissions
- `EDITOR`: Additional content management permissions
- `ADMIN`: Full system access including user management

Implemented using a RolesGuard that can be applied to routes requiring specific roles:

```typescript
@UseGuards(UserEmailJwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get()
getAllUsers() {
  // Only accessible to admin users
}
```

## API Key Authentication

For service-to-service communication, the system supports API key authentication:

1. API keys are managed in `.env`
2. Services can authenticate using the `SimpleApiKeyGuard`
3. Protected routes can be annotated with `@SimpleApiKeyProtected()`

## User Management

### User CRUD Operations

- **Create**: Register new users (public access)
- **Read**: Get user profiles (authenticated access)
- **Update**: Modify user details (admin access)
- **Delete**: Soft delete user accounts (admin access)

### Admin Functions

Administrators can perform additional operations:

- View all users in the system
- Change user roles
- Activate/deactivate accounts
- Soft delete user accounts if necessary

## External Communication

### Email Notifications

The system uses Resend API for sending transactional emails:

- Forgot password emails
- Email verification link

## OAuth Authentication Flow (Detailed)

The OAuth authentication flow has been updated to provide a more secure and seamless experience between the frontend and backend:

1. **Initiation**: Frontend redirects user to `/auth/google/login` endpoint
   - The backend is protected with API key authentication
   - GoogleAuthGuard handles the initial redirect to Google

2. **Google Authentication**: User authenticates with Google
   - Grants permission to requested scopes (email, profile)
   - Google redirects back to our callback URL with authorization code

3. **Backend Processing**: `/auth/google/callback` endpoint
   - Validates the callback and exchanges code for tokens with Google
   - Retrieves user profile information
   - Creates or retrieves the user account in our database
   - Sets the user as active (`isActive: true`)
   - Generates a temporary authentication token
   - Redirects to frontend with this token

4. **Frontend Completion**: Frontend receives token and completes authentication
   - Frontend extracts token from URL
   - Calls `/auth/complete-oauth` endpoint with the token
   - Receives standard authentication cookies

5. **Session Establishment**: Backend sets up user session
   - Validates the temporary OAuth token
   - Generates standard access and refresh tokens
   - Sets cookies for authenticated session
   - Returns user information to frontend

6. **Security Considerations**:
   - The temporary token has a short expiration time
   - The frontend should immediately exchange it for permanent session
   - All communication should be over HTTPS

7. **Code Implementation**:

```typescript
// Frontend code to complete OAuth flow
async function completeOAuthAuthentication(token) {
  const response = await fetch('/api/auth/complete-oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
    credentials: 'include', // Important for cookies
  });
  
  if (response.ok) {
    // User is now authenticated
    // Redirect to dashboard or home page
  }
}
```

## Integration with Frontend

The authentication system is designed to work with frontend applications through:

1. **Cookie-based authentication**: Secure HttpOnly cookies for token storage
2. **Frontend redirect support**: Configurable redirect URLs after authentication
3. **CORS configuration**: Properly configured to work with separate frontend domains
4. **OAuth token exchange**: Temporary token exchange for permanent session

## Configuration

Authentication settings are configured through environment variables:

```env
JWT_ACCESS_TOKEN_SECRET=your-access-token-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret
JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS=900000  # 15 minutes
JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS=604800000  # 7 days
```

OAuth providers require additional configuration:

```env
GOOGLE_AUTH_CLIENT_ID=your-google-client-id
GOOGLE_AUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_AUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Development Notes

### Testing the Authentication Flow

1. Register a user: `POST /users` with email and password
2. Verify email using the token sent to the user's email
3. Login: `POST /auth/login` with email and password
4. Access protected resources using the received tokens
5. Refresh tokens when access token expires: `POST /auth/refresh`
6. Logout: `POST /auth/logout`

### Common Issues

1. **JWT verification errors**: Check that the token secrets match between issuing and validation
2. **Cookie issues**: Ensure same-site and secure settings match your environment
3. **CORS problems**: Verify CORS configuration matches your frontend domain
4. **OAuth callback errors**: Check redirect URI configuration in both code and provider dashboard

## Future Improvements

1. Implement multifactor authentication
2. Add additional OAuth providers (Facebook, Apple, etc.)
3. Move token storage to Redis for better scalability
4. Implement audit logging for security events
5. Add IP-based rate limiting and suspicious activity detection
6. Account locking after multiple failed login attempts
7. Implement user activity tracking and notifications
8. Multitenancy support for managing multiple user bases
9. Implement user preferences and settings management
10. Add support for passwordless authentication methods (e.g., magic links)
11. Account recovery options for lost access (e.g., security questions)
12. Implement user session management dashboard for admins (Invalidate sessions, view active sessions)
13. Add support for custom user fields and metadata
14. Implement user activity logging for security and analytics

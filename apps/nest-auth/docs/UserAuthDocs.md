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

2. Flow:
   - User is redirected to Google's consent page
   - After granting permission, Google redirects back with profile data
   - Strategy's validate method processes the profile and finds/creates the user
   - User is logged in and JWT tokens are issued

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

## Integration with Frontend

The authentication system is designed to work with frontend applications through:

1. **Cookie-based authentication**: Secure HttpOnly cookies for token storage
2. **Frontend redirect support**: Configurable redirect URLs after authentication
3. **CORS configuration**: Properly configured to work with separate frontend domains

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
15. 

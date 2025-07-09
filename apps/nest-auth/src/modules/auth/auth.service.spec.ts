import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import authConfig from '@/configs/auth.config';
import generalConfig from '@/configs/general.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { EmailService } from '@/modules/message/email/email.service';
import { UsersService } from '@/modules/users/users.service';
import {
  createMockLogger,
  createMockLoggerFactory,
  createMockEmailService,
  createMockUsersService,
  createMockAuthConfig,
  createMockGeneralConfig,
  createMockUser,
  createMockResponse,
  createMockJwtService,
} from '@/test-utils/mock-factories';
import { TokenPayload } from '@/types';

// Mock bcryptjs at the module level
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-token-123'),
  })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let loggerFactory: jest.Mocked<LoggerFactory>;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  // Mock configurations
  const mockAuthConfig = createMockAuthConfig();
  const mockGeneralConfig = createMockGeneralConfig();
  const mockUser = createMockUser();
  const mockResponse = createMockResponse() as unknown as jest.Mocked<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock services
    mockLogger = createMockLogger();
    loggerFactory = createMockLoggerFactory(mockLogger);
    usersService = createMockUsersService();
    emailService = createMockEmailService();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: authConfig.KEY, useValue: mockAuthConfig },
        { provide: generalConfig.KEY, useValue: mockGeneralConfig },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        { provide: LoggerFactory, useValue: loggerFactory },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should initialize logger using LoggerFactory', async () => {
      // Create a fresh mock for this test
      const freshMockLogger = createMockLogger();
      const freshMockLoggerFactory = createMockLoggerFactory(freshMockLogger);

      // Create a fresh module to test constructor behavior
      const testModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: authConfig.KEY, useValue: mockAuthConfig },
          { provide: generalConfig.KEY, useValue: mockGeneralConfig },
          { provide: UsersService, useValue: usersService },
          { provide: JwtService, useValue: jwtService },
          { provide: EmailService, useValue: emailService },
          { provide: LoggerFactory, useValue: freshMockLoggerFactory },
        ],
      }).compile();

      // Get the service (this will trigger constructor)
      const definedService = testModule.get<AuthService>(AuthService);

      expect(definedService).toBeDefined();
      // The getLogger should be called during service construction
      expect(freshMockLoggerFactory.getLogger).toHaveBeenCalledWith(
        'AuthService',
      );
    });
  });

  describe('validateUserByEmail', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should successfully validate user with correct credentials', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.validateUserByEmail(email, password);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({ email });
      expect(compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `validateUserByEmail: ${email}`,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.validateUserByEmail(email, password),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User not found for email: ${email}`,
      );
      expect(mockLogger.errorAlert).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.validateUserByEmail(email, password),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid password for email: ${email}`,
      );
      expect(mockLogger.errorAlert).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      usersService.getUser.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        authService.validateUserByEmail(email, password),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Authentication failed for email: ${email}, error: ${dbError.message}`,
        true,
        dbError.stack,
      );
    });
  });

  describe('loginByEmail', () => {
    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      // Reset the mock before each test
      jwtService.sign.mockClear();
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);
    });

    it('should successfully login user without redirect', async () => {
      // Arrange
      usersService.updateUser.mockResolvedValue(undefined);

      // Act
      await authService.loginByEmail(mockUser, mockResponse, false);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(2); // Once for access token, once for refresh token
      expect(usersService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: mockTokens.refreshToken,
      });
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2); // For access and refresh tokens
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'Authentication',
        mockTokens.accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // test environment
          sameSite: 'lax',
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'Refresh',
        mockTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // test environment
          sameSite: 'lax',
        }),
      );
    });

    it('should handle redirect flow for OAuth', async () => {
      // Arrange
      const tempToken = 'temp-auth-token';
      usersService.updateUser.mockResolvedValue(undefined);

      // Clear and set up mocks in the exact order they'll be called
      jwtService.sign.mockClear();
      jwtService.sign.mockReset();

      // The service calls generateTokens first (2 calls), then creates temp token (1 call)
      jwtService.sign
        .mockReturnValueOnce(mockTokens.accessToken) // generateTokens - access token
        .mockReturnValueOnce(mockTokens.refreshToken) // generateTokens - refresh token
        .mockReturnValueOnce(tempToken); // temporary token for redirect

      // Act
      await authService.loginByEmail(mockUser, mockResponse, true);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(3); // 2 for tokens (Access & Refresh), 1 for temp token
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${mockAuthConfig.authUiRedirectUrl}/auth-callback#token=${tempToken}`,
      );
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should use secure settings in production environment', async () => {
      // Arrange
      const productionGeneralConfig = {
        ...mockGeneralConfig,
        nodeEnv: 'production',
      };
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: authConfig.KEY, useValue: mockAuthConfig },
          { provide: generalConfig.KEY, useValue: productionGeneralConfig },
          { provide: UsersService, useValue: usersService },
          { provide: JwtService, useValue: jwtService },
          { provide: EmailService, useValue: emailService },
          { provide: LoggerFactory, useValue: loggerFactory },
        ],
      }).compile();

      const productionService = module.get<AuthService>(AuthService);
      // Reset mocks for production test
      jwtService.sign.mockClear();
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);
      usersService.updateUser.mockResolvedValue(undefined);

      // Act
      await productionService.loginByEmail(mockUser, mockResponse, false);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'Authentication',
        mockTokens.accessToken,
        expect.objectContaining({
          secure: true, // production environment
          sameSite: 'none',
        }),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const userId = '1';

    it('should successfully verify valid refresh token', async () => {
      // Arrange
      (usersService.getUser as jest.Mock).mockResolvedValue(mockUser);
      (
        usersService.userRepository.validateRefreshToken as jest.Mock
      ).mockResolvedValue(true);

      // Act
      const result = await authService.verifyRefreshToken(refreshToken, userId);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(
        usersService.userRepository.validateRefreshToken,
      ).toHaveBeenCalledWith(mockUser, refreshToken);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      //TODO why we need to re-assert this as jest.Mock?
      (usersService.getUser as jest.Mock).mockResolvedValue(mockUser);
      (
        usersService.userRepository.validateRefreshToken as jest.Mock
      ).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.verifyRefreshToken(refreshToken, userId),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid refresh token for user ID: ${userId}, token: ${refreshToken}`,
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const repoError = new Error('Repository error');
      usersService.getUser.mockRejectedValue(repoError);

      // Act & Assert
      await expect(
        authService.verifyRefreshToken(refreshToken, userId),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error verifying refresh token: ${repoError.message}`,
      );
    });
  });

  describe('resetPassword', () => {
    const resetDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      password: 'newPassword123',
    };

    it('should successfully reset password with valid token', async () => {
      // Arrange
      const tokenData = {
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000),
      };
      // Access private property for testing
      (authService as any).passwordResetTokens.set(resetDto.token, tokenData);
      usersService.updateUser.mockResolvedValue(undefined);

      // Act
      const result = await authService.resetPassword(resetDto);

      // Assert
      expect(usersService.updateUser).toHaveBeenCalledWith(tokenData.userId, {
        password: resetDto.password,
      });
      expect(result).toEqual({
        message: 'Password has been successfully reset',
      });
      // Ensure the reset token is removed after successful password reset
      expect((authService as any).passwordResetTokens.has(resetDto.token)).toBe(
        false,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid-token';
      const actualValidToken = 'actual-valid-token';
      const resetDto: ResetPasswordDto = {
        token: invalidToken,
        password: 'newPassword123',
      };
      const tokenData = {
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000),
      };
      // Access private property for testing, set a valid token
      (authService as any).passwordResetTokens.set(actualValidToken, tokenData);

      // Act & Assert
      await expect(authService.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      // The valid token should still exist because only the invalid token was checked and rejected; no other tokens should be affected or removed from the store
      expect(
        (authService as any).passwordResetTokens.has(actualValidToken),
      ).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid password reset token: ${invalidToken}.`,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      const expiredTokenData = {
        userId: '1',
        expiresAt: new Date(Date.now() - 1000),
      };
      (authService as any).passwordResetTokens.set(
        resetDto.token,
        expiredTokenData,
      );

      // Act & Assert
      await expect(authService.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Password reset token expired for user ID: ${expiredTokenData.userId}`,
      );
      // Ensure the reset token is removed after expiration check
      expect((authService as any).passwordResetTokens.has(resetDto.token)).toBe(
        false,
      );
    });

    it('should handle user update errors gracefully', async () => {
      // Arrange
      const tokenData = {
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000),
      };
      (authService as any).passwordResetTokens.set(resetDto.token, tokenData);
      const updateError = new Error('Failed to update user');
      usersService.updateUser.mockRejectedValue(updateError);

      // Act & Assert
      await expect(authService.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error resetting password: ${updateError.message}`,
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should successfully send forgot password email for existing user', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      emailService.sendForgotPasswordEmail.mockResolvedValue(undefined);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({
        email: forgotPasswordDto.email,
      });
      expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
        'mock-token-123',
        expect.stringContaining('reset-password#token=mock-token-123'),
      );
      expect(result).toEqual({
        message: 'The password reset link has been sent.',
      });
      expect(
        (authService as any).passwordResetTokens.has('mock-token-123'),
      ).toBe(true);
    });

    it('should return success message for non-existing user (security)', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message: 'The password reset link has been sent.',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User with email ${forgotPasswordDto.email} not found`,
      );
      expect(emailService.sendForgotPasswordEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors gracefully', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      const emailError = new Error('Email service failed');
      emailService.sendForgotPasswordEmail.mockRejectedValue(emailError);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message: 'The password reset link has been sent.',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error in forgot password request: ${emailError.message}`,
      );
    });
  });

  describe('verifyEmail', () => {
    const verificationToken = 'valid-verification-token';

    it('should successfully verify email', async () => {
      // Arrange
      const expectedResult = { message: 'Email verified successfully' };
      usersService.verifyEmail.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.verifyEmail(verificationToken);

      // Assert
      expect(usersService.verifyEmail).toHaveBeenCalledWith(verificationToken);
      expect(result).toEqual(expectedResult);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Verifying email with token: ${verificationToken}`,
      );
    });

    it('should handle verification errors', async () => {
      // Arrange
      const verificationError = new Error('Invalid verification token');
      usersService.verifyEmail.mockRejectedValue(verificationError);

      // Act & Assert
      await expect(authService.verifyEmail(verificationToken)).rejects.toThrow(
        verificationError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Email verification failed: ${verificationError.message}`,
      );
    });
  });

  describe('logout', () => {
    it('should successfully clear authentication cookies', async () => {
      // Act
      const result = await authService.logout(mockResponse);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(3); // Clear Authentication, Refresh, and Authentication-fe cookies
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: false, // test environment
        sameSite: 'lax',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Refresh', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'Authentication-fe',
        {
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
        },
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'User logged out, cookies cleared',
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword123',
    };

    it('should successfully change password', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      usersService.updateUser.mockResolvedValue(undefined);

      // Act
      const result = await authService.changePassword(
        mockUser,
        changePasswordDto,
      );

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith({ id: mockUser.id });
      expect(compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(usersService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password: changePasswordDto.newPassword,
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.changePassword(mockUser, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Invalid current password for user: ${mockUser.email}`,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.changePassword(mockUser, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User not found for ID: ${mockUser.id}`,
      );
    });

    it('should handle password update errors gracefully', async () => {
      // Arrange
      usersService.getUser.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      const updateError = new Error('Failed to update password');
      usersService.updateUser.mockRejectedValue(updateError);

      // Act & Assert
      await expect(
        authService.changePassword(mockUser, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error changing password: ${updateError.message}`,
      );
    });
  });

  describe('completeOAuthAuthentication', () => {
    const validToken = 'valid-oauth-token';
    const decodedToken = { userId: '1', purpose: 'auth-redirect' };

    it('should successfully complete OAuth authentication', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(decodedToken);
      usersService.getUser.mockResolvedValue(mockUser);
      usersService.updateUser.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('access-token');
      jwtService.sign.mockReturnValue('refresh-token');

      // Act
      const result = await authService.completeOAuthAuthentication(
        validToken,
        mockResponse,
      );

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(validToken, {
        secret: mockAuthConfig.jwtAccessTokenSecret,
      });
      expect(jwtService.verify.mock.results[0].value).toEqual(decodedToken);
      expect(usersService.getUser).toHaveBeenCalledWith({
        id: decodedToken.userId,
      });
      expect(result).toEqual({
        message: 'Authentication completed successfully',
      });
    });

    it('should throw UnauthorizedException for invalid token purpose', async () => {
      // Arrange
      const invalidToken = { userId: '1', purpose: 'invalid' };
      jwtService.verify.mockReturnValue(invalidToken);

      // Act & Assert
      await expect(
        authService.completeOAuthAuthentication(validToken, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid token purpose for OAuth completion',
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(decodedToken);
      usersService.getUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.completeOAuthAuthentication(validToken, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User not found for ID: ${decodedToken.userId}`,
      );
    });

    it('should handle JWT verification errors', async () => {
      // Arrange
      const jwtError = new Error('Invalid JWT token');
      jwtService.verify.mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(
        authService.completeOAuthAuthentication(validToken, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `OAuth authentication completion failed: ${jwtError.message}`,
      );
    });
  });

  describe('requestPasswordReset (deprecated)', () => {
    it('should generate reset token and return success message', async () => {
      // Act
      const result = await authService.requestPasswordReset(mockUser);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a password reset link has been sent.',
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Password reset requested for user: ${mockUser.id}, token: mock-token-123`,
      );
      expect(
        (authService as any).passwordResetTokens.has('mock-token-123'),
      ).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Arrange - Mock the crypto randomBytes to throw an error
      const error = new Error('Unexpected error');
      const spy = jest
        .spyOn(await import('crypto'), 'randomBytes')
        .mockImplementation(() => {
          throw error;
        });

      // Act
      const result = await authService.requestPasswordReset(mockUser);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a password reset link has been sent.',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error in password reset request: ${error.message}`,
      );

      // Restore original implementation
      spy.mockRestore();
    });
  });

  describe('private methods', () => {
    describe('isSecureEnvironment', () => {
      it('should return true for production environment', async () => {
        // Arrange
        const productionConfig = {
          ...mockGeneralConfig,
          nodeEnv: 'production',
        };
        const module = await Test.createTestingModule({
          providers: [
            AuthService,
            { provide: authConfig.KEY, useValue: mockAuthConfig },
            { provide: generalConfig.KEY, useValue: productionConfig },
            { provide: UsersService, useValue: usersService },
            { provide: JwtService, useValue: jwtService },
            { provide: EmailService, useValue: emailService },
            { provide: LoggerFactory, useValue: loggerFactory },
          ],
        }).compile();

        const productionService = module.get<AuthService>(AuthService);
        // Reset mocks for production test
        jwtService.sign.mockClear();
        jwtService.sign.mockReturnValueOnce('access-token');
        jwtService.sign.mockReturnValueOnce('refresh-token');
        usersService.updateUser.mockResolvedValue(undefined);

        // Act
        await productionService.loginByEmail(mockUser, mockResponse, false);

        // Assert
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'Authentication',
          'access-token',
          expect.objectContaining({ secure: true }),
        );
      });

      it('should return true for staging environment', async () => {
        // Arrange
        const stagingConfig = { ...mockGeneralConfig, nodeEnv: 'staging' };
        const module = await Test.createTestingModule({
          providers: [
            AuthService,
            { provide: authConfig.KEY, useValue: mockAuthConfig },
            { provide: generalConfig.KEY, useValue: stagingConfig },
            { provide: UsersService, useValue: usersService },
            { provide: JwtService, useValue: jwtService },
            { provide: EmailService, useValue: emailService },
            { provide: LoggerFactory, useValue: loggerFactory },
          ],
        }).compile();

        const stagingService = module.get<AuthService>(AuthService);
        // Reset mocks for staging test
        jwtService.sign.mockClear();
        jwtService.sign.mockReturnValueOnce('access-token');
        jwtService.sign.mockReturnValueOnce('refresh-token');
        usersService.updateUser.mockResolvedValue(undefined);

        // Act
        await stagingService.loginByEmail(mockUser, mockResponse, false);

        // Assert
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'Authentication',
          'access-token',
          expect.objectContaining({ secure: true }),
        );
      });
    });

    describe('generateTokens', () => {
      it('should generate both access and refresh tokens', async () => {
        // Arrange
        const tokenPayload: TokenPayload = { userId: '1' };
        jwtService.sign.mockClear();
        jwtService.sign.mockReturnValueOnce('access-token');
        jwtService.sign.mockReturnValueOnce('refresh-token');

        // Act
        const result = await (authService as any).generateTokens(tokenPayload);

        // Assert
        expect(jwtService.sign).toHaveBeenCalledTimes(2);
        expect(jwtService.sign).toHaveBeenCalledWith(tokenPayload, {
          secret: mockAuthConfig.jwtAccessTokenSecret,
          expiresIn: `${mockAuthConfig.jwtAccessTokenExpirationTimeMs}ms`,
        });
        expect(jwtService.sign).toHaveBeenCalledWith(tokenPayload, {
          secret: mockAuthConfig.jwtRefreshTokenSecret,
          expiresIn: `${mockAuthConfig.jwtRefreshTokenExpirationTimeMs}ms`,
        });
        expect(result).toEqual({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });
      });
    });
  });
});

import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import authConfig from '@/configs/auth.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { EmailService } from '@/modules/message/email/email.service';
import {
  createMockLogger,
  createMockLoggerFactory,
  createMockUserRepository,
  createMockEmailService,
  createMockAuthConfig,
  createMockUser,
} from '@/test-utils/mock-factories';
import { UserRole } from '@/types';

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;
  let loggerFactory: jest.Mocked<LoggerFactory>;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  const mockAuthConfig = createMockAuthConfig();
  const mockUser = createMockUser();

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Create mocks
    mockLogger = createMockLogger();
    loggerFactory = createMockLoggerFactory(mockLogger);
    userRepository = createMockUserRepository();
    emailService = createMockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: authConfig.KEY, useValue: mockAuthConfig },
        { provide: EmailService, useValue: emailService },
        { provide: UserRepository, useValue: userRepository },
        { provide: LoggerFactory, useValue: loggerFactory },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(usersService).toBeDefined();
    });

    it('should initialize logger using LoggerFactory', async () => {
      // Arrange
      const freshMockLogger = createMockLogger();
      const freshMockLoggerFactory = createMockLoggerFactory(freshMockLogger);

      // Act
      const testModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: authConfig.KEY, useValue: mockAuthConfig },
          { provide: EmailService, useValue: emailService },
          { provide: UserRepository, useValue: userRepository },
          { provide: LoggerFactory, useValue: freshMockLoggerFactory },
        ],
      }).compile();

      const definedUserService = testModule.get<UsersService>(UsersService);

      // Assert
      expect(definedUserService).toBeDefined();
      expect(freshMockLoggerFactory.getLogger).toHaveBeenCalledWith(
        'UsersService',
      );
    });
  });

  describe('createUser', () => {
    it('should create a new inactive user and send verification email', async () => {
      // Arrange
      userRepository.getOrCreateUser.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act
      await usersService.createUser({ email: mockUser.email, password: 'pw' });

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(
        `New user created but not active: ${mockUser.email}`,
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw if user is already active', async () => {
      // Arrange
      userRepository.getOrCreateUser.mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      // Act & Assert
      await expect(
        usersService.createUser({ email: mockUser.email, password: 'pw' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User already exists and is active: ${mockUser.email}. Please login instead.`,
      );
    });

    it('should handle email service errors gracefully', async () => {
      // Arrange
      userRepository.getOrCreateUser.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      const emailError = new Error('Email service failed');
      emailService.sendVerificationEmail.mockRejectedValue(emailError);

      // Act
      const result = await usersService.createUser({
        email: mockUser.email,
        password: 'pw',
      });

      // Assert
      expect(result).toEqual({ ...mockUser, isActive: false });
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email: ${emailError.message}`,
      );
    });

    it('should successfully send verification email', async () => {
      // Arrange
      userRepository.getOrCreateUser.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      await usersService.createUser({ email: mockUser.email, password: 'pw' });

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Verification email sent to: ${mockUser.email}`,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Arrange
      (usersService as any).emailVerificationTokens.set('mock-token', {
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 10000),
      });
      jest.spyOn(usersService, 'updateUser').mockResolvedValue(undefined);

      // Act
      const result = await usersService.verifyEmail('mock-token');

      // Assert
      expect(result).toEqual({
        message: 'Email has been successfully verified',
      });
      expect(
        (usersService as any).emailVerificationTokens.has('mock-token'),
      ).toBe(false);
    });

    it('should throw if token is invalid', async () => {
      // Act & Assert
      await expect(usersService.verifyEmail('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid email verification token: invalid',
      );
    });

    it('should throw if token is expired', async () => {
      // Arrange
      (usersService as any).emailVerificationTokens.set('mock-token', {
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 10000),
      });

      // Act & Assert
      await expect(usersService.verifyEmail('mock-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Email verification token expired for user ID: ${mockUser.id}`,
      );
      expect(
        (usersService as any).emailVerificationTokens.has('mock-token'),
      ).toBe(false);
    });

    it('should throw if updateUser fails', async () => {
      // Arrange
      (usersService as any).emailVerificationTokens.set('mock-token', {
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 10000),
      });
      const updateError = new Error('fail');
      jest.spyOn(usersService, 'updateUser').mockRejectedValue(updateError);

      // Act & Assert
      await expect(usersService.verifyEmail('mock-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error verifying email: ${updateError.message}`,
      );
    });
  });

  describe('getUser', () => {
    it('should get user by email', async () => {
      // Arrange
      const activeMockUser = { ...mockUser, isActive: true };
      userRepository.findUserByEmail.mockResolvedValue(activeMockUser);

      // Act
      const result = await usersService.getUser({ email: mockUser.email });

      // Assert
      expect(result).toEqual(activeMockUser);
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        mockUser.email,
      );
    });

    it('should get user by id', async () => {
      // Arrange
      const activeMockUser = { ...mockUser, isActive: true };
      userRepository.findUserById.mockResolvedValue(activeMockUser);

      // Act
      const result = await usersService.getUser({ id: mockUser.id });

      // Assert
      expect(result).toEqual(activeMockUser);
      expect(userRepository.findUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw if neither email nor id provided', async () => {
      // Act & Assert
      await expect(usersService.getUser({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if user not found', async () => {
      // Arrange
      const query = { email: 'notfound@example.com' };
      userRepository.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(usersService.getUser(query)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User not found for query: ${JSON.stringify(query)}`,
      );
    });

    it('should throw if user is inactive and not admin', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        role: UserRole.USER,
      };
      userRepository.findUserById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(usersService.getUser({ id: mockUser.id })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Attempted to access inactive user account: ${mockUser.id}`,
      );
    });

    it('should allow inactive admin', async () => {
      // Arrange
      const inactiveAdmin = {
        ...mockUser,
        isActive: false,
        role: UserRole.ADMIN,
      };
      userRepository.findUserById.mockResolvedValue(inactiveAdmin);

      // Act
      const result = await usersService.getUser({ id: mockUser.id });

      // Assert
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should get inactive user when getActiveUser is false', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        role: UserRole.USER,
      };
      userRepository.findUserById.mockResolvedValue(inactiveUser);

      // Act
      const result = await usersService.getUser({ id: mockUser.id }, false);

      // Assert
      expect(result).toEqual(inactiveUser);
    });
  });

  describe('getAllUser', () => {
    it('should return all users', async () => {
      // Arrange
      const userList = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@example.com' },
      ];
      userRepository.findAll.mockResolvedValue(userList);

      // Act
      const result = await usersService.getAllUser();

      // Assert
      expect(result).toEqual(userList);
      expect(userRepository.findAll).toHaveBeenCalledWith();
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      // Arrange
      const updatedUser = { ...mockUser, isActive: true };
      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(updatedUser);

      // Act
      const result = await usersService.updateUser(mockUser.id, {
        isActive: true,
      });

      // Assert
      expect(usersService.getUser).toHaveBeenCalledWith(
        { id: mockUser.id },
        false,
      );
      expect(userRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        isActive: true,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should handle user not found in update', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'getUser')
        .mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(
        usersService.updateUser('nonexistent', { isActive: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrCreateUser', () => {
    it('should get or create user', async () => {
      // Arrange
      userRepository.getOrCreateUser.mockResolvedValue(mockUser);

      // Act
      const result = await usersService.getOrCreateUser({
        email: mockUser.email,
        password: 'pw',
      });

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.getOrCreateUser).toHaveBeenCalledWith(
        {
          email: mockUser.email,
          password: 'pw',
        },
        false,
      );
    });

    it('should get or create user with OAuth flag', async () => {
      // Arrange
      const oauthUser = { ...mockUser, isActive: true };
      userRepository.getOrCreateUser.mockResolvedValue(oauthUser);

      // Act
      const result = await usersService.getOrCreateUser(
        {
          email: mockUser.email,
          password: 'pw',
        },
        true,
      );

      // Assert
      expect(result).toEqual(oauthUser);
      expect(userRepository.getOrCreateUser).toHaveBeenCalledWith(
        {
          email: mockUser.email,
          password: 'pw',
        },
        true,
      );
    });

    it('should throw if user cannot be created', async () => {
      // Arrange
      const userData = { email: 'fail@example.com', password: 'pw' };
      userRepository.getOrCreateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(usersService.getOrCreateUser(userData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get or create user with email: ${userData.email}`,
      );
    });
  });

  describe('deleteUserWithResponse', () => {
    it('should delete user and return success', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser); // Spy on real getUser to return the mock user
      userRepository.deleteUser.mockResolvedValue([mockUser]);

      // Act
      const result = await usersService.deleteUserWithResponse(mockUser.id);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Deleting user with ID: ${mockUser.id} and generating response`,
      );
      expect(usersService.getUser).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.deleteUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
        deletedUsers: [mockUser],
      });
    });

    it('should return not found if no user deleted', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      userRepository.deleteUser.mockResolvedValue([]);

      // Act
      const result = await usersService.deleteUserWithResponse(mockUser.id);

      // Assert
      expect(result).toEqual({
        success: false,
        message: 'User not found',
        deletedUsers: undefined,
      });
    });

    it('should handle user not found before deletion', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'getUser')
        .mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(
        usersService.deleteUserWithResponse('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

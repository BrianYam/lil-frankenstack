import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserRequestDto } from './dto/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/update-user.request.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import authConfig from '@/configs/auth.config';
import { SimpleApiKeyAuthGuard } from '@/guards/simple-api-key-auth.guard';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import {
  createMockLogger,
  createMockLoggerFactory,
  createMockUsersService,
  createMockUser,
} from '@/test-utils/mock-factories';
import { UserRole } from '@/types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let loggerFactory: jest.Mocked<LoggerFactory>;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  // Mock data
  const mockUser = createMockUser();
  const mockAdminUser = createMockUser({
    id: '2',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  });

  const mockCreateUserRequest: CreateUserRequestDto = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: UserRole.USER,
  };

  const mockUpdateUserRequest: UpdateUserRequestDto = {
    email: 'updated@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock services
    mockLogger = createMockLogger();
    loggerFactory = createMockLoggerFactory(mockLogger);
    usersService = createMockUsersService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: SimpleApiKeyAuthGuard,
          useClass: SimpleApiKeyAuthGuard,
        },
        {
          provide: authConfig.KEY,
          useValue: { apiKey: 'test-api-key' },
        },
        { provide: UsersService, useValue: usersService },
        { provide: LoggerFactory, useValue: loggerFactory },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should initialize logger using LoggerFactory', async () => {
      // Arrange
      const freshMockLogger = createMockLogger();
      const freshMockLoggerFactory = createMockLoggerFactory(freshMockLogger);

      // Act
      const testModule = await Test.createTestingModule({
        controllers: [UsersController],
        providers: [
          {
            provide: SimpleApiKeyAuthGuard,
            useClass: SimpleApiKeyAuthGuard,
          },
          {
            provide: authConfig.KEY,
            useValue: { apiKey: 'test-api-key' },
          },
          { provide: UsersService, useValue: usersService },
          { provide: LoggerFactory, useValue: freshMockLoggerFactory },
        ],
      }).compile();

      const definedController =
        testModule.get<UsersController>(UsersController);

      // Assert
      expect(definedController).toBeDefined();
      expect(freshMockLoggerFactory.getLogger).toHaveBeenCalledWith(
        'UsersController',
      );
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      usersService.createUser.mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(mockCreateUserRequest);

      // Assert
      expect(usersService.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
      );
      expect(result).toEqual(mockUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Creating user with email: ${JSON.stringify(mockCreateUserRequest)}`,
      );
    });

    it('should handle user creation errors', async () => {
      // Arrange
      const creationError = new Error('User creation failed');
      usersService.createUser.mockRejectedValue(creationError);

      // Act & Assert
      await expect(controller.create(mockCreateUserRequest)).rejects.toThrow(
        'User creation failed',
      );
      expect(usersService.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
      );
    });

    it('should handle duplicate user email', async () => {
      // Arrange
      usersService.createUser.mockRejectedValue(
        new UnauthorizedException('User already exists'),
      );

      // Act & Assert
      await expect(controller.create(mockCreateUserRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUser', () => {
    it('should return all users when called by admin', async () => {
      // Arrange
      const userList = [mockUser, mockAdminUser];
      usersService.getAllUser.mockResolvedValue(userList);

      // Act
      const result = await controller.getUser(mockAdminUser);

      // Assert
      expect(usersService.getAllUser).toHaveBeenCalledWith();
      expect(result).toEqual(userList);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Current user: ${JSON.stringify(mockAdminUser)}`,
      );
    });

    it('should handle service errors when fetching users', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      usersService.getAllUser.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getUser(mockAdminUser)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      // Act
      const result = await controller.getCurrentUser(mockUser);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Fetching profile for current user ID: ${mockUser.id}`,
      );
    });

    it('should return user profile with all data (TODO: remove sensitive data)', async () => {
      // Arrange
      const userWithSensitiveData = {
        ...mockUser,
        password: 'hashed-password',
        refreshToken: 'refresh-token',
      };

      // Act
      const result = await controller.getCurrentUser(userWithSensitiveData);

      // Assert
      expect(result).toEqual(userWithSensitiveData);
      // TODO: This test should be updated when sensitive data is removed
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...mockUpdateUserRequest };
      usersService.updateUser.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.updateUser(
        mockUser.id,
        mockUpdateUserRequest,
        mockAdminUser,
      );

      // Assert
      expect(usersService.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        mockUpdateUserRequest,
      );
      expect(result).toEqual(updatedUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Updating user with ID: ${mockUser.id}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Update data: ${JSON.stringify(mockUpdateUserRequest)}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Request made by admin: ${mockAdminUser.id} : ${mockAdminUser.email}`,
      );
    });

    it('should handle user not found error', async () => {
      // Arrange
      usersService.updateUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        controller.updateUser(
          'nonexistent-id',
          mockUpdateUserRequest,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle service errors during update', async () => {
      // Arrange
      const updateError = new Error('Update failed');
      usersService.updateUser.mockRejectedValue(updateError);

      // Act & Assert
      await expect(
        controller.updateUser(
          mockUser.id,
          mockUpdateUserRequest,
          mockAdminUser,
        ),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const deleteResponse = {
        success: true,
        message: 'User deleted successfully',
        deletedUsers: [mockUser],
      };
      usersService.deleteUserWithResponse.mockResolvedValue(deleteResponse);

      // Act
      const result = await controller.deleteUser(mockUser.id);

      // Assert
      expect(usersService.deleteUserWithResponse).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(deleteResponse);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Deleting user with ID: ${mockUser.id}`,
      );
    });

    it('should handle user not found during deletion', async () => {
      // Arrange
      usersService.deleteUserWithResponse.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.deleteUser('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return failure response when user cannot be deleted', async () => {
      // Arrange
      const failureResponse = {
        success: false,
        message: 'User not found',
        deletedUsers: undefined,
      };
      usersService.deleteUserWithResponse.mockResolvedValue(failureResponse);

      // Act
      const result = await controller.deleteUser('nonexistent-id');

      // Assert
      expect(result).toEqual(failureResponse);
      expect(result.success).toBe(false);
    });

    it('should handle service errors during deletion', async () => {
      // Arrange
      const deleteError = new Error('Deletion failed');
      usersService.deleteUserWithResponse.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(controller.deleteUser(mockUser.id)).rejects.toThrow(
        'Deletion failed',
      );
    });
  });

  describe('API endpoint behavior', () => {
    it('should handle invalid user ID format in updateUser', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      usersService.updateUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        controller.updateUser(invalidId, mockUpdateUserRequest, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid user ID format in deleteUser', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      usersService.deleteUserWithResponse.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.deleteUser(invalidId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should log appropriate messages for each operation', async () => {
      // Arrange
      usersService.createUser.mockResolvedValue(mockUser);
      usersService.getAllUser.mockResolvedValue([mockUser]);
      usersService.updateUser.mockResolvedValue(mockUser);
      usersService.deleteUserWithResponse.mockResolvedValue({
        success: true,
        message: 'User deleted successfully',
        deletedUsers: [mockUser],
      });

      // Act - Test all operations
      await controller.create(mockCreateUserRequest);
      await controller.getUser(mockAdminUser);
      await controller.getCurrentUser(mockUser);
      await controller.updateUser(
        mockUser.id,
        mockUpdateUserRequest,
        mockAdminUser,
      );
      await controller.deleteUser(mockUser.id);

      // Assert - Check that appropriate debug messages were logged
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Creating user with email: ${JSON.stringify(mockCreateUserRequest)}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Current user: ${JSON.stringify(mockAdminUser)}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Fetching profile for current user ID: ${mockUser.id}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Updating user with ID: ${mockUser.id}`,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Deleting user with ID: ${mockUser.id}`,
      );
    });
  });
});

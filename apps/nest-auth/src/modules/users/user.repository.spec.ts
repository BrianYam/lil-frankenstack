import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash, compare } from 'bcryptjs';
import { CreateUserRequestDto } from './dto/create-user.request.dto';
import { UserRepository } from './user.repository';
import { DB_PROVIDER } from '@/modules/database/database.module';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import {
  createMockLogger,
  createMockLoggerFactory,
  createMockUser,
  createMockDrizzleDb,
  createMockDrizzleTransaction,
} from '@/test-utils/mock-factories';
import { NewUser, NewUserDetails, User, UserDetails, UserRole } from '@/types';

// Mock bcryptjs at the module level
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => 'eq-condition'),
  and: jest.fn(() => 'and-condition'),
  desc: jest.fn(() => 'desc-order'),
  relations: jest.fn(),
}));

jest.mock('@/modules/database/schema', () => ({
  usersTable: {
    $inferSelect: {} as User,
    $inferInsert: {} as NewUser,
  },
  userDetailsTable: {
    $inferSelect: {} as UserDetails,
    $inferInsert: {} as NewUserDetails,
  },
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDb: any;
  let mockTransaction: any;
  let loggerFactory: jest.Mocked<LoggerFactory>;
  let mockLogger: jest.Mocked<CustomLoggerService>;

  const mockUser = createMockUser();
  const mockCreateUserRequest: CreateUserRequestDto = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock database and transaction using factory functions
    mockDb = createMockDrizzleDb();
    mockTransaction = createMockDrizzleTransaction();

    // Create mocks
    mockLogger = createMockLogger();
    loggerFactory = createMockLoggerFactory(mockLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: DB_PROVIDER, useValue: mockDb },
        { provide: LoggerFactory, useValue: loggerFactory },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(userRepository).toBeDefined();
    });

    it('should initialize logger using LoggerFactory', async () => {
      // Arrange
      const freshMockLogger = createMockLogger();
      const freshMockLoggerFactory = createMockLoggerFactory(freshMockLogger);

      // Act
      const testModule = await Test.createTestingModule({
        providers: [
          UserRepository,
          { provide: DB_PROVIDER, useValue: mockDb },
          { provide: LoggerFactory, useValue: freshMockLoggerFactory },
        ],
      }).compile();

      const definedRepository = testModule.get<UserRepository>(UserRepository);

      // Assert
      expect(definedRepository).toBeDefined();
      expect(freshMockLoggerFactory.getLogger).toHaveBeenCalledWith(
        'UserRepository',
      );
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      (hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('should create a new user successfully', async () => {
      // Arrange
      mockDb.returning.mockResolvedValue([mockUser]);

      // Act
      const result = await userRepository.createUser(mockCreateUserRequest);

      // Assert
      expect(hash).toHaveBeenCalledWith(mockCreateUserRequest.password, 10);
      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDb.values).toHaveBeenCalledWith({
        email: mockCreateUserRequest.email,
        password: 'hashed-password',
        role: mockCreateUserRequest.role,
        isActive: false,
      });
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Creating user with email: ${JSON.stringify(mockCreateUserRequest)}`,
      );
    });

    it('should create user with OAuth activation', async () => {
      // Arrange
      mockDb.returning.mockResolvedValue([mockUser]);

      // Act
      await userRepository.createUser(mockCreateUserRequest, true);

      // Assert
      expect(mockDb.values).toHaveBeenCalledWith({
        email: mockCreateUserRequest.email,
        password: 'hashed-password',
        role: mockCreateUserRequest.role,
        isActive: true,
      });
    });

    it('should create user with transaction', async () => {
      // Arrange
      mockTransaction.returning.mockResolvedValue([mockUser]);

      // Act
      const result = await userRepository.createUser(
        mockCreateUserRequest,
        false,
        mockTransaction,
      );

      // Assert
      expect(mockTransaction.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(mockTransaction.values).toHaveBeenCalledWith({
        email: mockCreateUserRequest.email,
        password: 'hashed-password',
        role: mockCreateUserRequest.role,
        isActive: false,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockDb.returning.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.createUser(mockCreateUserRequest),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Failed to create user with email: ${mockCreateUserRequest.email}`,
        true,
        dbError.stack,
      );
    });

    it('should throw InternalServerErrorException on hashing error', async () => {
      // Arrange
      const hashError = new Error('Hashing failed');
      (hash as jest.Mock).mockRejectedValue(hashError);

      // Act & Assert
      await expect(
        userRepository.createUser(mockCreateUserRequest),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Failed to create user with email: ${mockCreateUserRequest.email}`,
        true,
        hashError.stack,
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      // Arrange
      const userWithDetails = {
        ...mockUser,
        details: [
          { id: '1', isDefault: true, userId: mockUser.id },
          { id: '2', isDefault: false, userId: mockUser.id },
        ],
      };
      mockDb.query.usersTable.findFirst.mockResolvedValue(userWithDetails);

      // Act
      const result = await userRepository.findUserByEmail(mockUser.email);

      // Assert
      expect(mockDb.query.usersTable.findFirst).toHaveBeenCalledWith({
        where: 'and-condition',
        with: { details: true },
      });
      expect(result).toEqual({
        ...userWithDetails,
        defaultDetails: userWithDetails.details[0],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Finding user by email: ${mockUser.email}`,
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockDb.query.usersTable.findFirst.mockResolvedValue(null);

      // Act
      const result = await userRepository.findUserByEmail(
        'nonexistent@example.com',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return user without defaultDetails when no default exists', async () => {
      // Arrange
      const userWithoutDefault = {
        ...mockUser,
        details: [
          { id: '1', isDefault: false, userId: mockUser.id },
          { id: '2', isDefault: false, userId: mockUser.id },
        ],
      };
      mockDb.query.usersTable.findFirst.mockResolvedValue(userWithoutDefault);

      // Act
      const result = await userRepository.findUserByEmail(mockUser.email);

      // Assert
      expect(result).toEqual({
        ...userWithoutDefault,
        defaultDetails: undefined,
      });
    });
  });

  describe('findUserById', () => {
    it('should find user by ID successfully', async () => {
      // Arrange
      const userWithDetails = {
        ...mockUser,
        details: [{ id: '1', isDefault: true, userId: mockUser.id }],
      };
      mockDb.query.usersTable.findFirst.mockResolvedValue(userWithDetails);

      // Act
      const result = await userRepository.findUserById(mockUser.id);

      // Assert
      expect(mockDb.query.usersTable.findFirst).toHaveBeenCalledWith({
        where: 'and-condition',
        with: { details: true },
      });
      expect(result).toEqual({
        ...userWithDetails,
        defaultDetails: userWithDetails.details[0],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Finding user by ID: ${mockUser.id}`,
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockDb.query.usersTable.findFirst.mockResolvedValue(null);

      // Act
      const result = await userRepository.findUserById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    const updateData = { isActive: true };

    beforeEach(() => {
      (hash as jest.Mock).mockResolvedValue('hashed-value');
    });

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateData };
      mockDb.where.mockResolvedValue([updatedUser]);

      // Act
      const result = await userRepository.updateUser(mockUser.id, updateData);

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDb.set).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalledWith('and-condition');
      expect(result).toEqual(updatedUser);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Updating user: ${mockUser.id}`,
      );
    });

    it('should hash refresh token when provided', async () => {
      // Arrange
      const dataWithRefreshToken = { refreshToken: 'plain-token' };
      mockDb.where.mockResolvedValue([mockUser]);

      // Act
      await userRepository.updateUser(mockUser.id, dataWithRefreshToken);

      // Assert
      expect(hash).toHaveBeenCalledWith('plain-token', 10);
      expect(mockDb.set).toHaveBeenCalledWith({
        refreshToken: 'hashed-value',
        updatedAt: expect.any(Date),
      });
    });

    it('should hash password when provided', async () => {
      // Arrange
      const dataWithPassword = { password: 'new-password' };
      mockDb.where.mockResolvedValue([mockUser]);

      // Act
      await userRepository.updateUser(mockUser.id, dataWithPassword);

      // Assert
      expect(hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockDb.set).toHaveBeenCalledWith({
        password: 'hashed-value',
        updatedAt: expect.any(Date),
      });
    });

    it('should update user with transaction', async () => {
      // Arrange
      mockTransaction.where.mockResolvedValue([mockUser]);

      // Act
      const result = await userRepository.updateUser(
        mockUser.id,
        updateData,
        mockTransaction,
      );

      // Assert
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockTransaction.set).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange
      const dbError = new Error('Database update failed');
      mockDb.where.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.updateUser(mockUser.id, updateData),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Failed to update user with ID: ${mockUser.id}`,
        true,
        dbError.stack,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const userList = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@example.com' },
      ];
      mockDb.query.usersTable.findMany.mockResolvedValue(userList);

      // Act
      const result = await userRepository.findAll();

      // Assert
      expect(mockDb.query.usersTable.findMany).toHaveBeenCalledWith({
        where: 'eq-condition',
        orderBy: ['desc-order'],
      });
      expect(result).toEqual(userList);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockDb.query.usersTable.findMany.mockResolvedValue([]);

      // Act
      const result = await userRepository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getOrCreateUser', () => {
    it('should return existing user when found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.getOrCreateUser(
        mockCreateUserRequest,
      );

      // Assert
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        mockCreateUserRequest.email,
      );
      expect(result).toEqual(mockUser);
    });

    it('should create new user when not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.getOrCreateUser(
        mockCreateUserRequest,
      );

      // Assert
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        mockCreateUserRequest.email,
      );
      expect(userRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
        false,
        undefined,
      );
      expect(result).toEqual(mockUser);
    });

    it('should create user with OAuth activation', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);

      // Act
      await userRepository.getOrCreateUser(mockCreateUserRequest, true);

      // Assert
      expect(userRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
        true,
        undefined,
      );
    });

    it('should create user with transaction', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);

      // Act
      await userRepository.getOrCreateUser(
        mockCreateUserRequest,
        false,
        mockTransaction,
      );

      // Assert
      expect(userRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
        false,
        mockTransaction,
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findUserByEmail')
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        userRepository.getOrCreateUser(mockCreateUserRequest),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Failed to get or create user with email: ${mockCreateUserRequest.email}`,
        true,
        expect.any(String),
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', async () => {
      // Arrange
      const userWithToken = { ...mockUser, refreshToken: 'hashed-token' };
      (compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userRepository.validateRefreshToken(
        userWithToken,
        'plain-token',
      );

      // Assert
      expect(compare).toHaveBeenCalledWith('plain-token', 'hashed-token');
      expect(result).toBe(true);
    });

    it('should return false for invalid refresh token', async () => {
      // Arrange
      const userWithToken = { ...mockUser, refreshToken: 'hashed-token' };
      (compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await userRepository.validateRefreshToken(
        userWithToken,
        'wrong-token',
      );

      // Assert
      expect(compare).toHaveBeenCalledWith('wrong-token', 'hashed-token');
      expect(result).toBe(false);
    });

    it('should return false when user has no refresh token', async () => {
      // Arrange
      const userWithoutToken = { ...mockUser, refreshToken: null };

      // Act
      const result = await userRepository.validateRefreshToken(
        userWithoutToken,
        'any-token',
      );

      // Assert
      expect(result).toBe(false);
      expect(compare).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const deletedUser = { ...mockUser, isDeleted: true };
      mockDb.returning.mockResolvedValue([deletedUser]);

      // Act
      const result = await userRepository.deleteUser(mockUser.id);

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDb.set).toHaveBeenCalledWith({
        isDeleted: true,
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalledWith('eq-condition');
      expect(result).toEqual([deletedUser]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Soft deleting user with ID: ${mockUser.id}`,
      );
    });

    it('should delete user with transaction', async () => {
      // Arrange
      const deletedUser = { ...mockUser, isDeleted: true };
      mockTransaction.returning.mockResolvedValue([deletedUser]);

      // Act
      const result = await userRepository.deleteUser(
        mockUser.id,
        mockTransaction,
      );

      // Assert
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.any(Object));
      expect(mockTransaction.set).toHaveBeenCalledWith({
        isDeleted: true,
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockTransaction.where).toHaveBeenCalledWith('eq-condition');
      expect(result).toEqual([deletedUser]);
    });

    it('should throw NotFoundException on database error', async () => {
      // Arrange
      mockDb.update.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act & Assert
      await expect(userRepository.deleteUser(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLogger.errorAlert).toHaveBeenCalledWith(
        `Failed to soft delete user with ID: ${mockUser.id}`,
        true,
        expect.any(String),
      );
    });

    it('should return empty array when user not found', async () => {
      // Arrange
      mockDb.returning.mockResolvedValue([]);

      // Act
      const result = await userRepository.deleteUser('nonexistent-id');

      // Assert
      expect(result).toEqual([]);
    });
  });
});

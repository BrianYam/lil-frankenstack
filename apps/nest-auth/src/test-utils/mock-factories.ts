import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from '@/configs/auth.config';
import generalConfig from '@/configs/general.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { EmailService } from '@/modules/message/email/email.service';
import { UserRepository } from '@/modules/users/user.repository';
import { UsersService } from '@/modules/users/users.service';
import { User, UserRole } from '@/types';

/**
 * Creates a mock logger with all required methods
 */
export const createMockLogger = (): jest.Mocked<CustomLoggerService> => {
  const mockLogger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    errorAlert: jest.fn(),
    warnAlert: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
    setContext: jest.fn(),
    // Properties that might be accessed
    localInstance: undefined,
    context: undefined,
  } as unknown as jest.Mocked<CustomLoggerService>;

  return mockLogger;
};

/**
 * Creates a mock logger factory that returns the provided logger
 */
export const createMockLoggerFactory = (
  logger: jest.Mocked<CustomLoggerService>,
): jest.Mocked<LoggerFactory> => {
  const mockFactory = {
    getLogger: jest.fn().mockReturnValue(logger),
    // Properties that might be accessed
    loggers: new Map(),
    moduleRef: {} as any,
  } as unknown as jest.Mocked<LoggerFactory>;

  return mockFactory;
};

/**
 * Creates a mock user repository with all required methods
 */
export const createMockUserRepository = (): jest.Mocked<UserRepository> => {
  const mockRepo = {
    createUser: jest.fn(),
    getOrCreateUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    findAll: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    validateRefreshToken: jest.fn(),
    // Properties that might be accessed
    db: {} as any,
    logger: createMockLogger(),
    loggerFactory: {} as any,
  } as unknown as jest.Mocked<UserRepository>;

  return mockRepo;
};

/**
 * Creates a mock email service with all required methods
 */
export const createMockEmailService = (): jest.Mocked<EmailService> => {
  const mockService = {
    sendEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendForgotPasswordEmail: jest.fn(),
    // Properties that might be accessed
    resend: {} as any,
    logger: createMockLogger(),
    loggerFactory: {} as any,
    emailConfig: {} as any,
  } as unknown as jest.Mocked<EmailService>;

  return mockService;
};

/**
 * Creates a mock users service with all required methods
 */
export const createMockUsersService = (): jest.Mocked<UsersService> => {
  const mockUserRepository = createMockUserRepository();

  const mockService = {
    getUser: jest.fn(),
    updateUser: jest.fn(),
    verifyEmail: jest.fn(),
    createUser: jest.fn(),
    getAllUser: jest.fn(),
    getOrCreateUser: jest.fn(),
    deleteUserWithResponse: jest.fn(),
    userRepository: mockUserRepository,
    // Properties that might be accessed
    logger: createMockLogger(),
    emailVerificationTokens: new Map(),
    authConfiguration: {} as any,
    emailService: createMockEmailService(),
    loggerFactory: {} as any,
  } as unknown as jest.Mocked<UsersService>;

  return mockService;
};

/**
 * Creates mock auth configuration
 */
export const createMockAuthConfig = (): ConfigType<typeof authConfig> => ({
  jwtAccessTokenSecret: 'test-access-secret',
  jwtRefreshTokenSecret: 'test-refresh-secret',
  jwtAccessTokenExpirationTimeMs: 900000, // 15 minutes
  jwtRefreshTokenExpirationTimeMs: 604800000, // 7 days
  authUiRedirectUrl: 'http://localhost:3000',
  apiKey: 'test-api-key',
});

/**
 * Creates mock general configuration
 */
export const createMockGeneralConfig = (): ConfigType<
  typeof generalConfig
> => ({
  nodeEnv: 'test',
  logLevel: 'info',
  corsOrigin: 'http://localhost:3000',
  port: 3000,
});

/**
 * Creates a mock user for testing
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  email: 'test@example.com',
  password: 'hashed-password',
  refreshToken: null,
  role: UserRole.USER,
  isActive: true,
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Creates a mock Express response object
 */
export const createMockResponse = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

/**
 * Creates a mock Drizzle database instance with common query builder methods
 */
export const createMockDrizzleDb = () => ({
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  query: {
    usersTable: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userDetailsTable: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
});

/**
 * Creates a mock Drizzle transaction instance
 */
export const createMockDrizzleTransaction = () => ({
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
});

/**
 * Creates a mock JWT service with all required methods and properties
 */
export const createMockJwtService = (): jest.Mocked<JwtService> => {
  const mockService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
    // Properties that might be accessed
    options: {} as any,
    logger: createMockLogger(),
    mergeJwtOptions: jest.fn(),
    overrideSecretFromOptions: jest.fn(),
    getSecretKey: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  return mockService;
};

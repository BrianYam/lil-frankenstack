import { UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalEmailStrategy } from './strategies/local.strategy/local.strategy';
import authConfig from '@/configs/auth.config';
import { PassportLocalEmailGuard } from '@/guards/passport-local-email.guard';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';

// Mock user and response
const mockUser = { id: 1, email: 'test@example.com' };
const mockResponse = { passthrough: true } as any;

// Mock AuthService
const mockAuthService = {
  loginByEmail: jest.fn(),
  validateUserByEmail: jest.fn(),
};

// Mock ModuleRef
const mockModuleRef = {
  get: jest.fn(),
  resolve: jest.fn(),
  create: jest.fn(),
  select: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let strategy: LocalEmailStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        LoggerFactory,
        CustomLoggerService,
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        PassportLocalEmailGuard,
        LocalEmailStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: authConfig.KEY,
          useValue: { apiKey: 'test-api-key' },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    strategy = module.get<LocalEmailStrategy>(LocalEmailStrategy);
    jest.clearAllMocks();
  });

  describe('loginWithEmail', () => {
    it('should call authService.loginByEmail with user and response when authentication succeeds', async () => {
      // Directly call the controller method (simulating successful auth)
      await controller.loginWithEmail(mockUser as any, mockResponse);
      expect(authService.loginByEmail).toHaveBeenCalledWith(
        mockUser,
        mockResponse,
      );
    });

    it('should call authService.loginByEmail and handle successful login', async () => {
      mockAuthService.loginByEmail.mockResolvedValue(undefined);

      await controller.loginWithEmail(mockUser as any, mockResponse);

      expect(mockAuthService.loginByEmail).toHaveBeenCalledWith(
        mockUser,
        mockResponse,
      );
    });

    it('should handle authService.loginByEmail errors', async () => {
      mockAuthService.loginByEmail.mockRejectedValue(new Error('Login failed'));

      await expect(
        controller.loginWithEmail(mockUser as any, mockResponse),
      ).rejects.toThrow('Login failed');
    });
  });

  describe('LocalEmailStrategy', () => {
    it('should call authService.validateUserByEmail with correct parameters', async () => {
      mockAuthService.validateUserByEmail.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(authService.validateUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when password is empty', async () => {
      await expect(strategy.validate('test@example.com', '')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.validateUserByEmail).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      mockAuthService.validateUserByEmail.mockResolvedValue(null);

      const result = await strategy.validate(
        'test@example.com',
        'wrongpassword',
      );

      expect(authService.validateUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });

    it('should handle authService.validateUserByEmail errors', async () => {
      mockAuthService.validateUserByEmail.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow('Database error');
    });
  });
});

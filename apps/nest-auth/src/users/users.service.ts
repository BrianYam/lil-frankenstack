import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserRequestDto } from './dto/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/update-user.request.dto';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { EmailService } from '@/message/email/email.service';
import {
  User,
  DeleteUserResponse,
  UserRole,
  ENV,
  GetUserQuery,
  UserWithDetails,
} from '@/types';
import { UserRepository } from '@/users/user.repository';

@Injectable()
export class UsersService {
  private readonly logger: CustomLoggerService;

  // Store email verification tokens in memory (similar to password reset tokens)
  // In production, consider using Redis or database storage
  //TODO may wanna move this to a more persistent storage like Redis or database
  private readonly emailVerificationTokens: Map<
    string,
    { userId: string; expiresAt: Date }
  > = new Map();

  constructor(
    public readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UsersService.name);
  }

  async createUser(createUserRequest: CreateUserRequestDto) {
    const user = await this.userRepository.getOrCreateUser(createUserRequest);

    if (!user.isActive) {
      this.logger.log(`New user created but not active: ${user.email}`);
      await this.sendVerificationEmail(user);
    } else {
      this.logger.warn(
        `User already exists and is active: ${user.email}. Please login instead.`,
      );
      throw new UnauthorizedException(
        'User already exists and is active. Please login instead.',
      );
    }

    return user;
  }

  /**
   * Sends verification email to a newly registered user
   * @param user User to send verification email to
   */
  private async sendVerificationEmail(user: User): Promise<void> {
    try {
      // Generate a secure random token
      const verificationToken = randomBytes(32).toString('hex');

      // Store the token with expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      this.emailVerificationTokens.set(verificationToken, {
        userId: user.id,
        expiresAt,
      });

      // Build verification link
      const verificationLink = `${this.configService.get<string>(ENV.AUTH_UI_REDIRECT_URL)}/verify-email#token=${verificationToken}`;

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        verificationLink,
      );

      this.logger.log(`Verification email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Verify a user's email using the provided token
   * @param token The verification token
   * @returns Success message if verified successfully
   * @throws UnauthorizedException if token is invalid or expired
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Get token data from storage
    const tokenData = this.emailVerificationTokens.get(token);

    if (!tokenData) {
      this.logger.warn(`Invalid email verification token: ${token}`);
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    // Check if token has expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      this.emailVerificationTokens.delete(token);
      this.logger.warn(
        `Email verification token expired for user ID: ${tokenData.userId}`,
      );
      throw new UnauthorizedException('Email verification token has expired');
    }

    try {
      // Activate the user account
      await this.updateUser(tokenData.userId, { isActive: true });

      // Remove the used token
      this.emailVerificationTokens.delete(token);

      return { message: 'Email has been successfully verified' };
    } catch (error) {
      this.logger.error(`Error verifying email: ${error.message}`);
      throw new UnauthorizedException('Failed to verify email');
    }
  }

  /**
   * Retrieves a user by email or ID.
   * Throws an error if neither is provided, nor if the user is not found.
   * Only returns active users unless the user is an admin.
   *
   * @param query - The query object containing either `email` or `id`.
   * @returns The found user.
   * @throws {Error} If neither email nor id is provided in the query.
   * @throws {NotFoundException} If the user is not found.
   * @throws {UnauthorizedException} If the user is inactive and not an admin.
   */
  async getUser(query: GetUserQuery): Promise<UserWithDetails> {
    let user: User;
    if (query.email) {
      user = await this.userRepository.findUserByEmail(query.email);
    } else if (query.id) {
      user = await this.userRepository.findUserById(query.id);
    } else {
      throw new Error('Invalid query - must provide email or id');
    }

    if (!user) {
      this.logger.warn('User not found for query: ' + JSON.stringify(query));
      throw new NotFoundException('User not found');
    }

    // Check if user is active unless they're an admin
    if (!user.isActive && user.role !== UserRole.ADMIN) {
      this.logger.warn(`Attempted to access inactive user account: ${user.id}`);
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async getAllUser() {
    return this.userRepository.findAll();
  }

  async updateUser(id: string, updateUserDto: UpdateUserRequestDto) {
    const user = await this.getUser({ id });
    return this.userRepository.updateUser(user.id, updateUserDto);
  }

  /**
   * Gets an existing user by their details or creates a new one if not found.
   *
   * @param data - The user data for creation or lookup
   * @param isOAuth - When true, automatically activates the user (for OAuth flows)
   * @returns The existing or newly created user
   */
  async getOrCreateUser(
    data: CreateUserRequestDto,
    isOAuth: boolean = false,
  ): Promise<User> {
    const user = await this.userRepository.getOrCreateUser(data, isOAuth);
    if (!user) {
      this.logger.error(
        `Failed to get or create user with email: ${data.email}`,
      );
      throw new NotFoundException(
        `User with email ${data.email} not found and could not be created.`,
      );
    }
    return user;
  }

  async deleteUserWithResponse(id: string): Promise<DeleteUserResponse> {
    this.logger.debug(`Deleting user with ID: ${id} and generating response`);

    // Find the user first to ensure they exist
    const user = await this.getUser({ id });
    const deletedUsers = await this.userRepository.deleteUser(user.id);
    const isDeleted = deletedUsers.length > 0;

    return {
      success: isDeleted,
      message: isDeleted ? 'User deleted successfully' : 'User not found',
      deletedUsers: isDeleted ? deletedUsers : undefined,
    };
  }
}

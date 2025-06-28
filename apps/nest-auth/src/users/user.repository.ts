/**
 * User repository implementation using Drizzle ORM for PostgreSQL
 */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { desc, eq, and } from 'drizzle-orm';
import { NodePgTransaction } from 'drizzle-orm/node-postgres';
import { DB_PROVIDER } from '@/database/database.module';
import { usersTable } from '@/database/schema';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { User, NewUser, DrizzleDB } from '@/types';
import { CreateUserRequestDto } from '@/users/dto/create-user.request.dto';

@Injectable()
export class UserRepository {
  private readonly logger: CustomLoggerService;

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DrizzleDB,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UserRepository.name);
  }

  /**
   * Creates a new user with hashed password
   * @param createUserRequest - User creation data
   * @param isOAuth - When true, automatically activates the user (for OAuth flows)
   * @param tx - Optional transaction object
   * @returns Newly created user
   */
  async createUser(
    createUserRequest: CreateUserRequestDto,
    isOAuth: boolean = false,
    tx?: NodePgTransaction<any, any>,
  ): Promise<User> {
    this.logger.debug(
      `Creating user with email: ${JSON.stringify(createUserRequest)}`,
    );
    try {
      const hashedPassword = await hash(createUserRequest.password, 10);

      const newUser: NewUser = {
        email: createUserRequest.email,
        password: hashedPassword,
        role: createUserRequest.role,
        isActive: isOAuth, // Activate immediately if from OAuth
      };
      this.logger.debug(`New user data: ${JSON.stringify(newUser)}`);

      const queryRunner = tx || this.db;
      const result = await queryRunner
        .insert(usersTable)
        .values(newUser)
        .returning();
      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to create user with email: ${createUserRequest.email}`,
        true,
        error.stack,
      );
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Finds a user by email
   * @param email - Email to search for
   * @returns User if found
   * @throws NotFoundException if user not found
   */
  async findUserByEmail(email: string): Promise<User> {
    this.logger.debug(`Finding user by email: ${email}`);

    return this.db.query.usersTable.findFirst({
      where: and(eq(usersTable.email, email), eq(usersTable.isDeleted, false)),
    });
  }

  /**
   * Finds a user by ID
   * @param id - UUID of the user
   * @returns User if found
   * @throws NotFoundException if user not found
   */
  async findUserById(id: string): Promise<User> {
    this.logger.debug(`Finding user by ID: ${id}`);

    return this.db.query.usersTable.findFirst({
      where: and(eq(usersTable.id, id), eq(usersTable.isDeleted, false)),
    });
  }

  /**
   * Updates a user by ID
   * @param id - ID of the user to update
   * @param data - Fields to update
   * @param tx - Optional transaction object
   * @returns Updated user
   */
  async updateUser(
    id: string,
    data: Partial<NewUser>,
    tx?: NodePgTransaction<any, any>,
  ): Promise<User> {
    this.logger.debug(`Updating user: ${id}`);
    this.logger.debug(`Data: ${JSON.stringify(data)}`);

    try {
      // Process refresh token if provided (hash it)
      if (data.refreshToken) {
        data.refreshToken = await hash(data.refreshToken, 10);
      }
      // Process password if provided (hash it)
      if (data.password) {
        data.password = await hash(data.password, 10);
      }

      // Always update the updatedAt timestamp
      data.updatedAt = new Date();

      const queryRunner = tx || this.db;
      const updatedUser = await queryRunner
        .update(usersTable)
        .set(data)
        .where(and(eq(usersTable.id, id), eq(usersTable.isDeleted, false)));

      return updatedUser[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to update user with ID: ${id}`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to update user: ${error.message}`,
      );
    }
  }

  /**
   * Gets all users from the database
   * @returns Array of all users
   */
  async findAll(): Promise<User[]> {
    return this.db.query.usersTable.findMany({
      where: eq(usersTable.isDeleted, false),
      orderBy: [desc(usersTable.createdAt)],
    });
  }

  /**
   * Gets an existing user by email or creates a new one
   * @param data - User data with email and password
   * @param isOAuth - When true, automatically activates the user (for OAuth flows)
   * @param tx - Optional transaction object
   * @returns Existing or newly created user
   */
  async getOrCreateUser(
    data: CreateUserRequestDto,
    isOAuth: boolean = false,
    tx?: NodePgTransaction<any, any>,
  ): Promise<User> {
    try {
      const existingUser = await this.findUserByEmail(data.email);

      // If user does not exist, create a new one
      if (!existingUser) {
        return this.createUser(data, isOAuth, tx);
      }
      return existingUser;
    } catch (error) {
      this.logger.errorAlert(
        `Failed to get or create user with email: ${data.email}`,
        true,
        error.stack,
      );
      throw new Error(`Failed to get or create user: ${error.message}`);
    }
  }

  /**
   * Validates a refresh token against a stored hash
   * @param user - User object containing the stored hashed refresh token
   * @param refreshToken - Plain text refresh token to validate
   * @returns Promise resolving to true if the token is valid, false otherwise
   */
  async validateRefreshToken(
    user: User,
    refreshToken: string,
  ): Promise<boolean> {
    if (!user.refreshToken) {
      return false;
    }
    return compare(refreshToken, user.refreshToken);
  }

  /**
   * Soft deletes a user by ID
   * @param id - UUID of the user to delete
   * @param tx - Optional transaction object
   * @returns User object that was soft deleted
   * @throws NotFoundException if user not found
   */
  async deleteUser(
    id: string,
    tx?: NodePgTransaction<any, any>,
  ): Promise<User[]> {
    this.logger.debug(`Soft deleting user with ID: ${id}`);

    try {
      const queryRunner = tx || this.db;

      // Soft delete the user
      return queryRunner
        .update(usersTable)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, id))
        .returning();
    } catch (error) {
      this.logger.errorAlert(
        `Failed to soft delete user with ID: ${id}`,
        true,
        error.stack,
      );
      throw new NotFoundException('User not found');
    }
  }
}

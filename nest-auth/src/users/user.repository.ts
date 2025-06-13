/**
 * User repository implementation using Drizzle ORM for PostgreSQL
 */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DB_PROVIDER } from '@/database/database.module';
import { usersTable } from '@/database/schema';
import { User, NewUser, DrizzleDB } from '@/types';
import { CreateUserRequestDto } from '@/users/dto/create-user.request.dto/create-user.request.dto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(@Inject(DB_PROVIDER) private readonly db: DrizzleDB) {}

  /**
   * Creates a new user with hashed password
   * @param createUserRequest - User creation data
   * @returns Newly created user
   */
  async createUser(createUserRequest: CreateUserRequestDto): Promise<User> {
    const hashedPassword = await hash(createUserRequest.password, 10);

    const newUser: NewUser = {
      email: createUserRequest.email,
      password: hashedPassword,
    };

    await this.db.insert(usersTable).values(newUser);
    return this.findUserByEmail(createUserRequest.email);
  }

  /**
   * Finds a user by email
   * @param email - Email to search for
   * @returns User if found
   * @throws NotFoundException if user not found
   */
  async findUserByEmail(email: string): Promise<User> {
    this.logger.debug(`Finding user by email: ${email}`);

    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    const user = result[0];

    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Finds a user by ID
   * @param id - UUID of the user
   * @returns User if found
   * @throws NotFoundException if user not found
   */
  async findUserById(id: string): Promise<User> {
    this.logger.debug(`Finding user by ID: ${id}`);

    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    const user = result[0];

    if (!user) {
      this.logger.warn(`User not found for id: ${id}`);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Updates a user by ID
   * @param id - ID of the user to update
   * @param data - Fields to update
   * @returns Updated user
   */
  async updateUser(id: string, data: Partial<NewUser>): Promise<User> {
    this.logger.debug(`Updating user: ${id}`);
    this.logger.debug(`Data: ${JSON.stringify(data)}`);

    // Check if user exists first
    await this.findUserById(id);

    // Process refresh token if provided (hash it)
    if (data.refreshToken) {
      data.refreshToken = await hash(data.refreshToken, 10);
    }

    // Always update the updatedAt timestamp
    data.updatedAt = new Date();

    await this.db.update(usersTable).set(data).where(eq(usersTable.id, id));

    return this.findUserById(id);
  }

  /**
   * Gets all users from the database
   * @returns Array of all users
   */
  async findAll(): Promise<User[]> {
    return this.db.select().from(usersTable);
  }

  /**
   * Gets an existing user by email or creates a new one
   * @param data - User data with email and password
   * @returns Existing or newly created user
   */
  async getOrCreateUser(data: CreateUserRequestDto): Promise<User> {
    try {
      return await this.findUserByEmail(data.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.createUser(data);
      }
      throw error;
    }
  }

  /**
   * Validates a refresh token against a stored hash
   * @param userId - User ID
   * @param refreshToken - Plain text refresh token to validate
   * @returns Boolean indicating if the token is valid
   */
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findUserById(userId);

    if (!user.refreshToken) {
      return false;
    }

    return compare(refreshToken, user.refreshToken);
  }
}

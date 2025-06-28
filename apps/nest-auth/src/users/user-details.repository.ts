import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgTransaction } from 'drizzle-orm/node-postgres';
import { DB_PROVIDER } from '@/database/database.module';
import { userDetailsTable } from '@/database/schema';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import {
  DrizzleDB,
  NewUserDetails,
  UserDetails,
  FindUserDetailsParams,
} from '@/types';

@Injectable()
export class UserDetailsRepository {
  private readonly logger: CustomLoggerService;

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DrizzleDB,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UserDetailsRepository.name);
  }

  /**
   * Creates a new user details entry
   * @param newDetails - User details data
   * @param tx - Optional transaction object
   * @returns Newly created user details
   */
  async create(
    newDetails: NewUserDetails,
    tx?: NodePgTransaction<any, any>,
  ): Promise<UserDetails> {
    this.logger.debug(
      `Creating user details for user ID: ${newDetails.userId}`,
    );

    try {
      const queryRunner = tx || this.db;

      // If isDefault is true, set all other details for this user to not default
      if (newDetails.isDefault) {
        await queryRunner
          .update(userDetailsTable)
          .set({ isDefault: false })
          .where(eq(userDetailsTable.userId, newDetails.userId));
      }

      const result = await queryRunner
        .insert(userDetailsTable)
        .values(newDetails)
        .returning();

      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to create user details for user ID: ${newDetails.userId}`,
        true,
        error.stack,
      );
      throw new Error(`Failed to create user details: ${error.message}`);
    }
  }

  /**
   * Finds user details based on provided criteria.
   * @param params - Object containing search criteria.
   * @param params.id - UUID of the user details.
   * @param params.userId - UUID of the user.
   * @param params.isDefault - Boolean to find default user details.
   * @returns UserDetails if found, otherwise null.`
   */
  async findUserDetails(params: FindUserDetailsParams): Promise<UserDetails> {
    this.logger.debug(
      `Finding user details with params: ${JSON.stringify(params)}`,
    );

    // if id or userId is not provided, throw parameter error
    if (!params.id && !params.userId) {
      this.logger.error('No search parameters provided for user details');
      throw new BadRequestException(
        'At least one search parameter (id, userId) must be provided',
      );
    }

    const conditions = [];

    if (params.id) {
      conditions.push(eq(userDetailsTable.id, params.id));
    }

    if (params.userId) {
      conditions.push(eq(userDetailsTable.userId, params.userId));
    }

    if (params.isDefault !== undefined) {
      conditions.push(eq(userDetailsTable.isDefault, params.isDefault));
    }

    return this.db.query.userDetailsTable.findFirst({
      where: and(...conditions),
    });
  }

  /**
   * Finds all user details for a given user ID
   * @param userId - UUID of the user
   * @returns Array of UserDetails
   */
  async findManyByUserId(userId: string): Promise<UserDetails[]> {
    this.logger.debug(`Finding user details for user ID: ${userId}`);

    return this.db.query.userDetailsTable.findMany({
      where: eq(userDetailsTable.userId, userId),
    });
  }

  /**
   * Updates user details by ID
   * @param id - ID of the user details to update
   * @param userId
   * @param data - Fields to update
   * @param tx - Optional transaction object
   * @returns Updated user details
   */
  async update(
    id: string,
    userId: string,
    data: Partial<NewUserDetails>,
    tx?: NodePgTransaction<any, any>,
  ): Promise<UserDetails> {
    this.logger.debug(`Updating user details with ID: ${id}`);
    this.logger.debug(`Data: ${JSON.stringify(data)}`);

    try {
      const queryRunner = tx || this.db;

      // If isDefault is being set to true, set all other details for this user to not default
      if (data.isDefault === true) {
        await queryRunner
          .update(userDetailsTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(userDetailsTable.userId, userId),
              eq(userDetailsTable.id, sql`NOT ${id}`), // Exclude the current detail
            ),
          );
      }

      // Always update the updatedAt timestamp
      data.updatedAt = new Date();

      const result = await queryRunner
        .update(userDetailsTable)
        .set(data)
        .where(eq(userDetailsTable.id, id))
        .returning();

      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to update user details with ID: ${id}`,
        true,
        error.stack,
      );
      throw new Error(`Failed to update user details: ${error.message}`);
    }
  }

  /**
   * Sets a specific user detail as default and ensures only one is default for the user.
   * @param id - ID of the user detail to set as default
   * @param userId - ID of the user
   * @param tx - Optional transaction object
   * @returns The updated default user details
   */
  async setDefault(
    id: string,
    userId: string,
    tx?: NodePgTransaction<any, any>,
  ): Promise<UserDetails> {
    this.logger.debug(
      `Setting user details ID: ${id} as default for user ID: ${userId}`,
    );

    const queryRunner = tx || this.db;

    // First, set all user details for this user to not default
    await queryRunner
      .update(userDetailsTable)
      .set({ isDefault: false })
      .where(eq(userDetailsTable.userId, userId));

    // Then, set the specified user detail to default
    const result = await queryRunner
      .update(userDetailsTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(userDetailsTable.id, id))
      .returning();

    if (!result[0]) {
      this.logger.warn(`User details not found for ID: ${id}`);
      throw new NotFoundException('User details not found');
    }

    return result[0];
  }

  /**
   * Deletes user details by ID
   * @param id - UUID of the user details to delete
   * @param tx - Optional transaction object
   * @returns UserDetails object that was deleted
   * @throws NotFoundException if user details not found
   */
  async delete(
    id: string,
    tx?: NodePgTransaction<any, any>,
  ): Promise<UserDetails> {
    this.logger.debug(`Deleting user details with ID: ${id}`);

    try {
      const queryRunner = tx || this.db;

      const result = await queryRunner
        .delete(userDetailsTable)
        .where(eq(userDetailsTable.id, id))
        .returning();

      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to delete user details with ID: ${id}`,
        true,
        error.stack,
      );
      throw new Error(`Failed to delete user details: ${error.message}`);
    }
  }
}

//TODO !!!!!!! come to think about this, should we just use the relation ? for all those detail
// think about the actual service use case of user details

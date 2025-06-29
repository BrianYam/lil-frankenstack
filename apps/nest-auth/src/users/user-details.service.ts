import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDetailsRequestDto } from './dto/create-user-details.request.dto';
import { UpdateUserDetailsRequestDto } from './dto/update-user-details.request.dto';
import { UserDetailsRepository } from './user-details.repository';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { UserDetails, NewUserDetails } from '@/types';

@Injectable()
export class UserDetailsService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly userDetailsRepository: UserDetailsRepository,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UserDetailsService.name);
  }

  /**
   * Creates a new user details entry
   * @param createUserDetailsRequest - User details data
   * @returns Newly created user details
   */
  async create(
    userId: string,
    createUserDetailsRequest: CreateUserDetailsRequestDto,
  ): Promise<UserDetails> {
    this.logger.debug(`Creating user details for user ID: ${userId}`);
    const newDetails: NewUserDetails = {
      userId,
      ...createUserDetailsRequest,
      isDefault: createUserDetailsRequest.isDefault || false,
    };
    return this.userDetailsRepository.create(newDetails);
  }

  /**
   * Gets user details by ID
   * @param id - UUID of the user details
   * @returns UserDetails if found
   * @throws NotFoundException if user details not found
   */
  async getById(id: string): Promise<UserDetails> {
    this.logger.debug(`Getting user details by ID: ${id}`);
    const userDetails = await this.userDetailsRepository.findUserDetails({
      id,
    });
    if (!userDetails) {
      this.logger.error(`User details not found for ID: ${id}`);
      throw new NotFoundException(`User details not found for ID: ${id}`);
    }
    return userDetails;
  }

  /**
   * Gets all user details for a given user ID
   * @param userId - UUID of the user
   * @returns Array of UserDetails
   */
  async getByUserId(userId: string): Promise<UserDetails[]> {
    this.logger.debug(`Getting user details for user ID: ${userId}`);
    const userDetails =
      await this.userDetailsRepository.findManyByUserId(userId);
    if (!userDetails || userDetails.length === 0) {
      this.logger.warn(`No user details found for user ID: ${userId}`);
      return [];
    }
    return userDetails;
  }

  /**
   * Gets the default user details for a given user ID
   * @param userId - UUID of the user
   * @returns Default UserDetails if found
   * @throws NotFoundException if no default user details found
   */
  async getDefaultByUserId(userId: string): Promise<UserDetails> {
    this.logger.debug(`Getting default user details for user ID: ${userId}`);
    const userDefaultDetail = await this.userDetailsRepository.findUserDetails({
      userId,
      isDefault: true,
    });
    if (!userDefaultDetail) {
      this.logger.warn(`No default user details found for user ID: ${userId}`);
      throw new NotFoundException(
        `Default user details not found for user ID: ${userId}`,
      );
    }
    return userDefaultDetail;
  }

  /**
   * Updates user details by ID
   * @param id - ID of the user details to update
   * @param updateUserDetailsRequest - Fields to update
   * @returns Updated user details
   */
  async update(
    id: string,
    updateUserDetailsRequest: UpdateUserDetailsRequestDto,
  ): Promise<UserDetails> {
    this.logger.debug(`Updating user details with ID: ${id}`);
    this.logger.debug(
      `Update data: ${JSON.stringify(updateUserDetailsRequest)}`,
    );
    const existingDetails = await this.getById(id);
    return this.userDetailsRepository.update(
      existingDetails.id,
      existingDetails.userId,

      updateUserDetailsRequest,
    );
  }

  /**
   * Sets a specific user detail as default and ensures only one is default for the user.
   * @param id - ID of the user detail to set as default
   * @param userId - ID of the user
   * @returns The updated default user details
   */
  async setDefault(id: string, userId: string): Promise<UserDetails> {
    this.logger.debug(
      `Setting user details ID: ${id} as default for user ID: ${userId}`,
    );
    return this.userDetailsRepository.setDefault(id, userId);
  }

  /**
   * Deletes user details by ID
   * @param id - UUID of the user details to delete
   * @returns UserDetails object that was deleted
   * @throws NotFoundException if user details not found
   */
  async delete(id: string): Promise<UserDetails> {
    this.logger.debug(`Deleting user details with ID: ${id}`);
    const existingDetails = await this.getById(id);
    return this.userDetailsRepository.delete(existingDetails.id);
  }
}

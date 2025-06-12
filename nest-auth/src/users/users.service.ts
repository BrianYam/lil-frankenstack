import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { User } from '../database/schema/user.schema';
import { CreateUserRequestDto } from './dto/create-user.request.dto/create-user.request.dto';

export type Userx = {
  userId: number;
  username: string;
  password: string;
};

//TODO: This is a mockup, replace with a actual database
const users: Userx[] = [
  { userId: 1, username: 'admin', password: 'admin' },
  { userId: 2, username: 'user', password: 'user' },
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findUserByName(username: string): Promise<Userx | undefined> {
    return users.find((user) => user.username === username);
  }

  async createUser(createUserRequest: CreateUserRequestDto) {
    await new this.userModel({
      ...createUserRequest,
      password: await hash(createUserRequest.password, 10), //10 is the number of salt rounds, it is additional random characters added to the hash string for additional security
    }).save();
  }

  //create a new function of findUserByEmail
  async findUser(query: FilterQuery<User>): Promise<User | undefined> {
    this.logger.debug(`Query: ${JSON.stringify(query)}`);

    // Convert _id to ObjectId if it exists in the query
    if (query._id && typeof query._id === 'string') {
      query._id = new ObjectId(query._id);
    }

    const user = await this.userModel.findOne(query);
    console.log('User found', user);
    this.logger.log(`User: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.warn(`User not found for query: ${JSON.stringify(query)}`);
      throw new NotFoundException('User not found');
    }
    return user.toObject();
  }

  async findAll() {
    return this.userModel.find({});
  }

  //update user
  async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
    this.logger.debug(`Query: ${JSON.stringify(query)}`);
    this.logger.debug(`Data: ${JSON.stringify(data)}`);

    // Convert _id to ObjectId if it's a string
    if (query._id && typeof query._id === 'string') {
      query._id = new ObjectId(query._id);
    }

    // Find the user before updating
    const user = await this.userModel.findOne(query);
    this.logger.log(`User found: ${JSON.stringify(user)}`);

    // If user is found, proceed with the update
    if (user) {
      const updatedUser = await this.userModel.findOneAndUpdate(query, data, {
        new: true,
      });
      this.logger.log(`Updated User: ${JSON.stringify(updatedUser)}`);
      return updatedUser;
    } else {
      this.logger.warn(`User not found for query: ${JSON.stringify(query)}`);
      return null;
    }
  }

  async getOrCreateUser(data: CreateUserRequestDto) {
    const user = await this.userModel.findOne({ email: data.email });
    if (user) {
      return user;
    }
    return this.createUser(data);
  }
}

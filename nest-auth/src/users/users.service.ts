import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { User } from '../database/schema/user.schema';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';
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
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findUserByName(username: string): Promise<Userx | undefined> {
    return users.find((user) => user.username === username);
  }

  //create a new function of createUser
  async createUser(createUserRequest: CreateUserRequestDto) {
    await new this.userModel({
      ...createUserRequest,
      password: await hash(createUserRequest.password, 10), //10 is the number of salt rounds, it is additional random characters added to the hash string for additional security
    }).save();
  }

  //create a new function of findUserByEmail
  async findUser(query: FilterQuery<User>): Promise<User | undefined> {
    console.log('Query', query);

    // Convert _id to ObjectId if it exists in the query
    if (query._id && typeof query._id === 'string') {
      query._id = new ObjectId(query._id);
    }

    const user = await this.userModel.findOne(query);
    console.log('User found', user);

    if (!user) {
      console.log('User not found xx', query);
      throw new NotFoundException('User not found');
    }
    return user.toObject();
  }

  async findAll() {
    return this.userModel.find({});
  }

  //update user
  async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
    console.log('Query', query);
    console.log('Data', data);

    // Convert _id to ObjectId if it's a string
    if (query._id && typeof query._id === 'string') {
      query._id = new ObjectId(query._id);
    }

    // Find the user before updating
    const user = await this.userModel.findOne(query);
    console.log('User found', user);

    // If user is found, proceed with the update
    if (user) {
      const updatedUser = await this.userModel.findOneAndUpdate(query, data, {
        new: true,
      });
      console.log('Updated User', updatedUser);
      return updatedUser;
    } else {
      console.log('User not found, update not performed');
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

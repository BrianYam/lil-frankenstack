import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@/repositories/user/user.repository';
import { CreateUserRequestDto } from './dto/create-user.request.dto/create-user.request.dto';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { User } from '../database/schema/user.schema';

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

  constructor(private readonly userRepository: UserRepository) {}

  async getUserByName(username: string): Promise<Userx | undefined> {
    return users.find((user) => user.username === username);
  }

  async createUser(createUserRequest: CreateUserRequestDto) {
    return this.userRepository.createUser(createUserRequest);
  }

  async getUser(query: FilterQuery<User>): Promise<User | undefined> {
    return this.userRepository.findUser(query);
  }

  async getAllUser() {
    return this.userRepository.findAll();
  }

  async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
    return this.userRepository.updateUser(query, data);
  }

  async getOrCreateUser(data: CreateUserRequestDto) {
    return this.userRepository.getOrCreateUser(data);
  }
}

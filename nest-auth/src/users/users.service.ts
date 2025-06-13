import { Injectable, Logger } from '@nestjs/common';
import { CreateUserRequestDto } from './dto/create-user.request.dto/create-user.request.dto';
import { NewUser } from '@/types';
import { UserRepository } from '@/users/user.repository';

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

  constructor(public readonly userRepository: UserRepository) {}

  async getUserByName(username: string): Promise<Userx | undefined> {
    return users.find((user) => user.username === username);
  }

  async createUser(createUserRequest: CreateUserRequestDto) {
    return this.userRepository.createUser(createUserRequest);
  }

  async getUser(query: { email?: string; id?: string }) {
    if (query.email) {
      return this.userRepository.findUserByEmail(query.email);
    }
    if (query.id) {
      return this.userRepository.findUserById(query.id);
    }
    throw new Error('Invalid query - must provide email or id');
  }

  async getAllUser() {
    return this.userRepository.findAll();
  }

  async updateUser(query: { id: string }, data: Partial<NewUser>) {
    return this.userRepository.updateUser(query.id, data);
  }

  async getOrCreateUser(data: CreateUserRequestDto) {
    return this.userRepository.getOrCreateUser(data);
  }
}

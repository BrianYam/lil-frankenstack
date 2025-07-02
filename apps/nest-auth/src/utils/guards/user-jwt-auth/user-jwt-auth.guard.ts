import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '@/types';

@Injectable()
export class UserJwtAuthGuard extends AuthGuard(AUTH_STRATEGY.USER_AUTH_JWT) {}

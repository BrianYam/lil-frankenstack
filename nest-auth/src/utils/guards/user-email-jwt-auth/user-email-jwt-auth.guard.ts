import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '@/types';

@Injectable()
export class UserEmailJwtAuthGuard extends AuthGuard(
  AUTH_STRATEGY.USER_EMAIL_JWT,
) {}

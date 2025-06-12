import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '@/types';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard(AUTH_STRATEGY.JWT_REFRESH) {}

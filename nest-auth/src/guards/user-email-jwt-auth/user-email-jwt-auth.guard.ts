import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserEmailJwtAuthGuard extends AuthGuard('user-email-jwt') {}

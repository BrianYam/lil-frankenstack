import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../auth.service';

@Injectable()
export class LocalEmailStrategy extends PassportStrategy(
  Strategy,
  'passport-local-email', // name this strategy 'passport-local-email'
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  // note any strategy we implement on this 'validate' function, whatever we return here will be available in the request object in the controller, this is a benefit of using passport library
  async validate(email: string, password: string): Promise<any> {
    return this.authService.validateUserByEmail(email, password);
  }
}

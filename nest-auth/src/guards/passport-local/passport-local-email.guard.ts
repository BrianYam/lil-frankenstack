import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PassportLocalEmailGuard extends AuthGuard('passport-local-email') {
  //specify to use the 'local' strategy (if local.strategy.ts is not named)
  //local.strategy.ts name specified to 'my-local'
}

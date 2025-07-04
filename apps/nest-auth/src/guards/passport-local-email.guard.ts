import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '@/types';

@Injectable()
export class PassportLocalEmailGuard extends AuthGuard(
  AUTH_STRATEGY.PASSPORT_LOCAL_EMAIL,
) {
  //specify to use the 'local' strategy (if local.strategy.ts is not named)
  //local.strategy.ts name specified to 'my-local'
}

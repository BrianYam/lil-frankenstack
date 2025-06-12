import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getCurrentUserByContext = (context: ExecutionContext) =>
  context.switchToHttp().getRequest().user; // this user is set by UserLocalStrategy that UserPassportLocalGuard is using, and the login/email

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);

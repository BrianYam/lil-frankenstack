import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyProtected } from './utils/decorators/api-key-protected.decorator';

@Controller()
@ApiKeyProtected() // Apply to all routes in this controller
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

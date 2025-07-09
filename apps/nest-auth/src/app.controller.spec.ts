import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import authConfig from '@/configs/auth.config';
import { SimpleApiKeyAuthGuard } from '@/guards/simple-api-key-auth.guard';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SimpleApiKeyAuthGuard,
          useClass: SimpleApiKeyAuthGuard,
        },
        {
          provide: authConfig.KEY,
          useValue: { apiKey: 'test-api-key' },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});

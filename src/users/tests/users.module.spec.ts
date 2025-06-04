import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersController } from '../users.controller';
import { S3Service } from '../../storage/s3.service';
import { EmailService } from '../../email/email.service'; 

describe('UsersModule', () => {
  let usersModule: TestingModule;

  beforeEach(async () => {
    usersModule = await Test.createTestingModule({

      providers: [
        UsersService,
        S3Service,
        {
     
          provide: EmailService,
          useValue: {
            isConfigured: jest.fn().mockReturnValue(true),
            sendEmail: jest.fn(),
            generateVerificationEmailHtml: jest.fn(),
            generateGenericNotificationHtml: jest.fn(),
          },
        },
      ],
      controllers: [UsersController],
    }).compile();
  });

  it('should compile the module', () => {
    expect(usersModule).toBeDefined();
  });

  it('should have UsersService as a provider', () => {
    const usersService = usersModule.get<UsersService>(UsersService);
    expect(usersService).toBeDefined();
  });

  it('should have UsersController as a controller', () => {
    const usersController = usersModule.get<UsersController>(UsersController);
    expect(usersController).toBeDefined();
  });

  it('should have S3Service as a provider', () => {
    const s3Service = usersModule.get<S3Service>(S3Service);
    expect(s3Service).toBeDefined();
  });
});
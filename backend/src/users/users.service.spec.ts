import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should register a new user and hash password', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const saved = {
      id: 'uuid',
      name: 'Jane Doe',
      email: 'jane@email.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepo.create.mockReturnValue(saved);
    mockRepo.save.mockResolvedValue(saved);

    const result = await service.create({
      name: 'Jane Doe',
      email: 'jane@email.com',
      password: '!HorsePurpleHat9',
    });

    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('jane@email.com');
  });

  it('should throw ConflictException if email already exists', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'uuid', email: 'jane@email.com' });

    await expect(
      service.create({
        name: 'Jane',
        email: 'jane@email.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RedisTokenStoreService } from './redis-token-store.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let service: AuthService;
  const save = jest.fn();
  const findOne = jest.fn();
  const findOneBy = jest.fn();

  const tokenServiceMock = {
    signTokens: jest.fn(() => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })),
    refreshTokenJti: jest.fn(() => 'jti-1'),
    verifyRefreshToken: jest.fn(),
  };

  const redisTokenStoreMock = {
    saveRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    save.mockReset();
    findOne.mockReset();
    findOneBy.mockReset();
    tokenServiceMock.signTokens.mockClear();
    tokenServiceMock.refreshTokenJti.mockClear();
    redisTokenStoreMock.saveRefreshToken.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { save, findOneBy, findOne },
        },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: RedisTokenStoreService, useValue: redisTokenStoreMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => '7d') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.dev', password: 'Password123' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@test.dev',
        name: 'A',
        password: 'hashed-wrong',
      });

      await expect(
        service.login({ email: 'a@test.dev', password: 'wrongPassword1' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should issue token pair and store refresh token in redis', async () => {
      findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@test.dev',
        name: 'A',
        password:
          '$2b$10$oAhabMqzdrxgGQvNqbWkTeqLdcTjIH.zc3eW0R3cGXwuLT29HixKO', // password: Password123
      });

      const result = await service.login({
        email: 'a@test.dev',
        password: 'Password123',
      });

      expect(tokenServiceMock.signTokens).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'a@test.dev',
      });
      expect(redisTokenStoreMock.saveRefreshToken).toHaveBeenCalledWith(
        'jti-1',
        { userId: 'user-1', email: 'a@test.dev' },
        604800,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'a@test.dev',
        name: 'A',
      });
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email is already registered', async () => {
      findOneBy.mockResolvedValue({ id: 'user-1', email: 'a@test.dev' });

      await expect(
        service.register({
          email: 'a@test.dev',
          password: 'Password123',
        }),
      ).rejects.toThrow('Email is already registered');
    });

    it('should save a new user and issue tokens', async () => {
      findOneBy.mockResolvedValue(null);
      save.mockImplementation((entity: Partial<User>) => ({
        id: 'user-2',
        email: entity.email,
        name: entity.name ?? null,
      }));

      const result = await service.register({
        email: 'new@test.dev',
        password: 'Password123',
        name: 'New User',
      });

      expect(save).toHaveBeenCalledWith(
        expect.objectContaining<Partial<User>>({
          email: 'new@test.dev',
          name: 'New User',
        }),
      );
      expect(result.user.email).toBe('new@test.dev');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException when refresh token is missing', async () => {
      await expect(service.refresh()).rejects.toThrow('Refresh token missing');
    });
  });
});

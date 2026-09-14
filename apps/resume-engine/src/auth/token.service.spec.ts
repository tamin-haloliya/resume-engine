import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
              return 'refresh-secret';
            }),
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '1m';
              return '2d';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signTokens', () => {
    it('should produce an access and a refresh token', () => {
      const { accessToken, refreshToken } = service.signTokens({
        sub: 'user-1',
        email: 'a@test.dev',
      });

      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should reject a refresh token used as access token', () => {
      const { refreshToken } = service.signTokens({
        sub: 'user-1',
        email: 'a@test.dev',
      });

      expect(() => service.verifyAccessToken(refreshToken)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return the payload with a jti for valid refresh tokens', () => {
      const { refreshToken } = service.signTokens({
        sub: 'user-1',
        email: 'a@test.dev',
      });

      const payload = service.verifyRefreshToken(refreshToken);
      expect(payload.sub).toBe('user-1');
      expect(payload.jti).toBeDefined();
    });
  });
});

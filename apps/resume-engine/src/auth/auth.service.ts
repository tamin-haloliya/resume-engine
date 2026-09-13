import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { AuthResult } from './interfaces/auth-result.interface';
import { RedisTokenStoreService } from './redis-token-store.service';
import { TokenService } from './token.service';
import { expiryInSeconds } from './utils/token-expiry.util';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly redisTokenStore: RedisTokenStoreService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepository.findOneBy({
      email: dto.email,
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.userRepository.save({
      email: dto.email,
      password: passwordHash,
      name: dto.name ?? null,
    });

    return await this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, password: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.issueTokens(user);
  }

  async refresh(refreshToken?: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const stored = await this.redisTokenStore.getRefreshToken(payload.jti!);
    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    await this.redisTokenStore.deleteRefreshToken(payload.jti!);
    return await this.issueTokens(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      const stored = await this.redisTokenStore.getRefreshToken(payload.jti!);
      if (stored) {
        await this.redisTokenStore.deleteRefreshToken(payload.jti!);
      }
    } catch {
      // token already expired/invalid — nothing to revoke
    }
  }

  async getProfile(userId: string): Promise<AuthResult['user']> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    };
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const { accessToken, refreshToken } = this.tokenService.signTokens({
      sub: user.id,
      email: user.email,
    });

    const jti = this.tokenService.refreshTokenJti(refreshToken);
    const ttlSeconds = expiryInSeconds(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    );

    await this.redisTokenStore.saveRefreshToken(
      jti,
      {
        userId: user.id,
        email: user.email,
      },
      ttlSeconds,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
      },
    };
  }
}

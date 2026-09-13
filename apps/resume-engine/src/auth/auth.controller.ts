import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Cookies } from './decorators/cookies.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type {
  AuthResult,
  AuthenticatedUser,
} from './interfaces/auth-result.interface';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthResult['user'] }> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Cookies(REFRESH_TOKEN_COOKIE) refreshTokenCookie: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthResult['user'] }> {
    const refreshToken = dto.refreshToken ?? refreshTokenCookie;
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Cookies(REFRESH_TOKEN_COOKIE) refreshTokenCookie: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = dto.refreshToken ?? refreshTokenCookie;
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(res);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ user: AuthResult['user'] }> {
    const profile = await this.authService.getProfile(user.id);
    return { user: profile };
  }

  private setAuthCookies(res: Response, result: AuthResult): void {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: this.cookieMaxAge('JWT_ACCESS_EXPIRES_IN', 15 * 60 * 1000),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: this.cookieMaxAge(
        'JWT_REFRESH_EXPIRES_IN',
        7 * 24 * 60 * 60 * 1000,
      ),
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private cookieMaxAge(envKey: string, fallbackMs: number): number {
    return this.parseExpiryMs(this.config.get<string>(envKey), fallbackMs);
  }

  private parseExpiryMs(
    expiresIn: string | undefined,
    fallbackMs: number,
  ): number {
    if (!expiresIn) {
      return fallbackMs;
    }
    const match = /^(\d+)\s*([smhd])$/.exec(expiresIn.trim().toLowerCase());
    if (!match) {
      return fallbackMs;
    }
    const value = parseInt(match[1], 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[match[2]] ?? fallbackMs);
  }
}

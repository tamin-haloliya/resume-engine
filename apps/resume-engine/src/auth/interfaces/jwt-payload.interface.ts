export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  type: TokenType;
  jti?: string;
}

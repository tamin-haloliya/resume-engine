# Auth Implementation Report — Resume Engine

**Branch:** `feature/auth-jwt-redis` (created from `main`)
**Date:** 2026-09-13
**Scope:** JWT access + refresh token authentication with Redis-backed refresh token storage for the `resume-engine` NestJS app.

---

## 1. Method Followed

### Token strategy: Access + Refresh (cookie + Redis)

1. **Password hashing** — bcrypt (10 salt rounds). Passwords are never stored in plain text; the `password` column is `select: false` so it never leaks by default.
2. **Access token** — short-lived JWT (default `15m`), signed with `JWT_ACCESS_SECRET`, stored in an **HttpOnly cookie** (`access_token`). Shipped to the browser with `httpOnly`, `sameSite: 'lax'`, `secure: true` in production.
3. **Refresh token** — long-lived JWT (default `7d`), signed with `JWT_REFRESH_SECRET`, carrying a unique `jti`. It is **whitelisted in Redis** (`auth:refresh:{jti} → JSON {userId, email}`) with a TTL equal to the refresh-token lifetime. It is also set as an HttpOnly cookie (`refresh_token`) and returned in the JSON body for non-browser clients.
4. **Refresh rotation** — on `POST /auth/refresh`, the presented refresh token is verified (signature, expiry, `type === 'refresh'`) and then checked against Redis. If it exists, the old record is deleted and a fresh token pair is issued (old refresh tokens are unusable after rotation).
5. **Logout / revocation** — `POST /auth/logout` deletes the refresh token from Redis and clears both cookies. Because the refresh token is revoked server-side, a stolen refresh token cannot be used after logout.
6. **Endpoint protection** — a global `JwtAuthGuard` (via `APP_GUARD`) protects every route by default. Public routes are opted out with the `@Public()` decorator (auth endpoints + health check). The access token is read from the `access_token` cookie first, with an `Authorization: Bearer` fallback.
7. **Security notes** — secrets come from environment variables validated by the existing Joi schema; `.env` is gitignored so secrets are never committed; a committed `.env.example` documents the required vars.

### Commit strategy

Changes were split into **13 focused commits** (see section 4) instead of one bulk commit. Each commit groups a logical unit (dependencies, token service, redis store, auth service, guard/strategies, wiring, tests).

### Verification performed

- `npx tsc -p apps/resume-engine/tsconfig.app.json --noEmit` — clean
- `npm run build` (nest webpack build) — successful
- `npm run lint` — no *new* problems vs `main` (17 pre-existing problems belong to unrelated files)
- `npx jest apps/resume-engine/src/auth` — **12 tests passing** (3 suites: auth.service, auth.controller, token.service)
- Live smoke test against running Postgres/Redis/RabbitMQ/MinIO stack:
  - `POST /api/v1/auth/register` → 201, sets `access_token` + `refresh_token` HttpOnly cookies, refresh token stored in Redis
  - `GET /api/v1/auth/me` with cookie → 200 (user payload); without cookie → 401
  - `GET /api/v1/job` with cookie → 200; without cookie → **401** (protected)
  - `POST /api/v1/auth/refresh` → rotates tokens and returns the user
  - `POST /api/v1/auth/logout` → 204, Redis key removed, cookies cleared

---

## 2. Files Changed

### New files

| File | What was added |
| --- | --- |
| `apps/resume-engine/src/auth/entities/user.entity.ts` | TypeORM `User` entity (`id`, `email` unique, `password` with `select: false`, `name`, timestamps). |
| `apps/resume-engine/src/auth/dto/register.dto.ts` | Register validation (email, strong password rule, optional name). |
| `apps/resume-engine/src/auth/dto/login.dto.ts` | Login validation. |
| `apps/resume-engine/src/auth/dto/refresh-token.dto.ts` | Optional refresh-token body for refresh/logout (cookie fallback also accepted). |
| `apps/resume-engine/src/auth/interfaces/auth-result.interface.ts` | `AuthResult` and `AuthenticatedUser` types. |
| `apps/resume-engine/src/auth/interfaces/jwt-payload.interface.ts` | JWT payload type (`sub`, `email`, `type`, `jti`). |
| `apps/resume-engine/src/auth/token.service.ts` | Signs/verifies access & refresh JWTs; refresh tokens get a `jti`; tokens are type-checked on verify. |
| `apps/resume-engine/src/auth/utils/token-expiry.util.ts` | Parses `15m`/`7d`-style expiry strings into seconds (TTL for Redis). |
| `apps/resume-engine/src/auth/redis-token-store.service.ts` | Redis wrapper: `saveRefreshToken`, `getRefreshToken`, `deleteRefreshToken` on `auth:refresh:{jti}` keys. |
| `apps/resume-engine/src/auth/auth.service.ts` | Business logic: `register`, `login`, `refresh` (rotation + Redis allowlist check), `logout` (revocation), `getProfile`. |
| `apps/resume-engine/src/auth/jwt.strategy.ts` | Passport `JwtStrategy`: extracts access token from cookie (Bearer fallback), validates with `JWT_ACCESS_SECRET`. |
| `apps/resume-engine/src/auth/guards/jwt-auth.guard.ts` | Global `AuthGuard('jwt')` that skips routes marked `@Public()`. |
| `apps/resume-engine/src/auth/decorators/public.decorator.ts` | `@Public()` + `IS_PUBLIC_KEY` metadata. |
| `apps/resume-engine/src/auth/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator reading `request.user`. |
| `apps/resume-engine/src/auth/decorators/cookies.decorator.ts` | `@Cookies(name)` param decorator reading cookies. |
| `apps/resume-engine/src/auth/auth.controller.ts` | Routes: `register`, `login`, `refresh`, `logout`, `me`. Sets/clears HttpOnly cookies (`access_token`, `refresh_token`). |
| `apps/resume-engine/src/auth/auth.module.ts` | Registers User repo, JwtModule, PassportModule, strategies, guard as `APP_GUARD`; exports `AuthService`. |
| `apps/resume-engine/src/auth/auth.service.spec.ts` | Unit tests: login success/failure, register conflict/success, missing refresh token. |
| `apps/resume-engine/src/auth/auth.controller.spec.ts` | Controller definition test. |
| `apps/resume-engine/src/auth/token.service.spec.ts` | Token signing + type-mismatch/expiry/`jti` verification tests. |
| `.env.example` | Documents the new JWT vars (secrets template — mirrors existing env vars). |

### Modified files

| File | What changed |
| --- | --- |
| `package.json` | Added deps: `@nestjs/jwt` (v11), `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `cookie-parser`; dev deps: `@types/passport`, `@types/passport-jwt`, `@types/cookie-parser`. |
| `package-lock.json` | Lockfile updated for new/changed deps. |
| `apps/resume-engine/src/redis/redis.module.ts` | **Bug fix:** the `REDIS_CLIENT` provider factory previously never returned the `Redis` instance — now it does (plus error logging). Required so the token store can actually use Redis. |
| `apps/resume-engine/src/resume-engine.module.ts` | Added JWT env vars to the Joi validation schema; imported `AuthModule`. |
| `apps/resume-engine/src/main.ts` | Enabled `cookieParser()` middleware so the guard/controller can read cookies. |
| `apps/resume-engine/src/resume-engine.controller.ts` | Marked the health-check endpoint `@Public()`. |
| `.env` (gitignored — not committed) | Added `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`. |

---

## 3. New Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | — (required, min 16 chars) | Signs access tokens. |
| `JWT_REFRESH_SECRET` | — (required, min 16 chars) | Signs refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL. |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL (also used as Redis key TTL). |

---

## 4. Commits (13)

| Commit | Message |
| --- | --- |
| `d0fbf32` | chore(auth): add jwt, passport, bcryptjs and cookie-parser dependencies |
| `a7a05f1` | fix(redis): return redis client instance from provider factory |
| `1910a08` | chore(config): add jwt secrets and expiry to env schema and example env |
| `9326ae0` | chore(auth): remove redundant types package for bcryptjs v3 |
| `5e6b5b1` | chore(auth): pin @nestjs/jwt to v11 for cjs/ts-jest compatibility |
| `18ae9ce` | feat(auth): add user entity, auth dtos and result interfaces |
| `222372b` | feat(auth): add token service with access and refresh jwt signing |
| `598b10d` | feat(auth): add redis token store for caching refresh tokens |
| `37f94ae` | feat(auth): implement auth service with register, login, refresh and logout |
| `1c8787a` | feat(auth): add jwt strategy, guard and auth decorators |
| `7d534fa` | feat(auth): add auth controller and auth module |
| `fe9daef` | feat(api): register auth module, enable cookie parser and protect endpoints with global guard |
| `ee1660b` | test(auth): add unit tests for auth service, controller and token service |

---

## 5. API Endpoints

All under `http://localhost:3000/api/v1`:

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create account, issue token pair, set cookies, store refresh token in Redis. |
| `POST` | `/auth/login` | Public | Verify credentials, issue token pair, set cookies, store refresh token in Redis. |
| `POST` | `/auth/refresh` | Public | Rotate refresh token (body or cookie), issue new pair, update Redis + cookies. |
| `POST` | `/auth/logout` | Public | Revoke refresh token from Redis, clear cookies. |
| `GET` | `/auth/me` | JWT (cookie) | Return the authenticated user's profile. |
| `GET` | `/job`, `/resume/:id`, `/matching/*` etc. | JWT (cookie) | Now protected by the global guard. |

Request cookies (browser): `access_token` (HttpOnly, 15m), `refresh_token` (HttpOnly, 7d).

---

## 6. Notes / Caveats

- The 3 `devDependencies`/`dependencies` install steps printed `npm audit` findings — these are pre-existing supply-chain warnings in the repo, unrelated to the auth feature.
- 7 test suites under `apps/resume-engine/src` were **already failing on `main`** (e.g. `job.controller.spec`, `resume.controller.spec`, minio storage specs) because they test controllers/services without providing mocked dependencies. They are unrelated to this change; the auth suites add 12 new passing tests with no new failures.
- `@nestjs/jwt` was pinned to v11 because v12 ships ESM-only and breaks the repo's ts-jest test setup. NestJS 11 is the compatible major.
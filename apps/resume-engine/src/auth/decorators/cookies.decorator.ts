import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookies = createParamDecorator(
  (
    data: string | undefined,
    context: ExecutionContext,
  ): string | Record<string, string> | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;
    if (data) {
      return cookies?.[data];
    }
    return cookies;
  },
);

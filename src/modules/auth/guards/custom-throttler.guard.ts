import { Injectable, HttpException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common/interfaces';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      {
        statusCode: 429,
        message: 'Too many requests',
        error: 'Rate limit exceeded',
      },
      429,
    );
  }
}
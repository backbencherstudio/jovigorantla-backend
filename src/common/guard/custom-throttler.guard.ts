import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common/interfaces';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip throttling if @SkipThrottle() is used
    const isSkipThrottle = this.reflector.get<boolean>(
      'skipThrottle',
      context.getHandler(),
    );
    
    if (isSkipThrottle) {
      return true;
    }
    
    // Only apply throttling if @Throttle() is explicitly used
    const routeLimit = this.reflector.get<{ limit: number; ttl: number }[]>(
      'throttle',
      context.getHandler(),
    );
    
    if (!routeLimit) {
      return true; // Skip throttling if no @Throttle decorator
    }
    
    return super.canActivate(context);
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException("Too many requests");
  }
}
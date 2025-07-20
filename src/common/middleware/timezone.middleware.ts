import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if timezone is sent in the request headers or body
    const timezone = req.headers['timezone'] || req.body.timezone;
    req['timezone'] = timezone;
    // console.log(`User's timezone: ${timezone}`);

    next();
  }
}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import appConfig from '../../../config/app.config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { UserRepository } from 'src/common/repository/user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      //jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ignoreExpiration: false,

      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // console.log('cookie => ', req?.cookies?.jwt);
          return req?.cookies?.jwt || null;
        },
      ]),

      ignoreExpiration: true,
      secretOrKey: appConfig().jwt.secret,
    });
  }

  async validate(payload: any) {
    const user = await UserRepository.getUserByEmail(payload?.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 🔐 Blocked user check here
    if (user.status === 0) {
      throw new UnauthorizedException('User is blocked');
    }
    return { userId: payload.sub, email: payload.email };
  }
}

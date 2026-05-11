import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but does not throw if the token is missing or invalid.
 * Sets req.user to the authenticated user if the token is valid, otherwise leaves it undefined.
 * Useful for endpoints that work for both guests and authenticated users.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    return user as TUser;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as any;
  }
}

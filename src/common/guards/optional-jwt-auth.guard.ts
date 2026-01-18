import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * 
 * This guard attempts to authenticate the user using JWT but does not
 * reject the request if no token is provided or if the token is invalid.
 * 
 * Use this for endpoints that should work for both authenticated and
 * unauthenticated users, but with different behavior (e.g., vendors see
 * all their products, customers only see published products).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any) {
        // Don't throw an error if authentication fails
        // Just return null/undefined user
        return user || null;
    }

    canActivate(context: ExecutionContext) {
        // Call parent canActivate to attempt authentication
        // but catch any errors and still allow the request to proceed
        return super.canActivate(context);
    }
}

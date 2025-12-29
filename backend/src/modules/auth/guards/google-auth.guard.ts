import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    constructor() {
        super();
    }

    handleRequest<TUser = any>(err: any, user: TUser): TUser {
        if (err || !user) {
            throw err;
        }
        return user;
    }
}

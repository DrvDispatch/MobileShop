import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createHmac } from 'crypto';

// Shared secret for signing OAuth state - uses JWT_SECRET from env
const getStateSecret = () => process.env.JWT_SECRET || 'oauth-state-secret';

/**
 * Sign OAuth state - MUST be a single base64url string with NO DOTS
 * Google rejects JWT-style `payload.signature` format
 */
export function signOAuthState(tenantDomain: string, returnPath: string): string {
    // Build absolute URL (Google does not tolerate relative URLs)
    const isLocalhost = tenantDomain.includes('localhost');
    const protocol = isLocalhost ? 'http' : 'https';
    const absoluteReturnUrl = returnPath.startsWith('http')
        ? returnPath
        : `${protocol}://${tenantDomain}${returnPath}`;

    // Minimal payload with absolute URL
    const payload = JSON.stringify({
        t: tenantDomain,
        r: absoluteReturnUrl,
    });

    // Create signature
    const sig = createHmac('sha256', getStateSecret())
        .update(payload)
        .digest('base64url');

    // Wrap payload + signature into ONE object, then encode ONCE
    // Result: single base64url string with NO DOTS
    const wrapped = JSON.stringify({
        p: payload,
        s: sig,
    });

    const state = Buffer.from(wrapped).toString('base64url');

    console.log('[OAuth] Generated state:', {
        stateLength: state.length,
        hasDot: state.includes('.'),
        tenantDomain,
        returnUrl: absoluteReturnUrl,
    });

    return state;
}

/**
 * Verify and decode signed OAuth state
 */
export function verifyOAuthState(state: string): { tenantDomain: string; returnUrl: string } | null {
    try {
        if (!state) {
            console.warn('[OAuth] No state provided');
            return null;
        }

        // Decode the outer wrapper
        const wrappedJson = Buffer.from(state, 'base64url').toString();
        const wrapped = JSON.parse(wrappedJson);

        if (!wrapped.p || !wrapped.s) {
            console.warn('[OAuth] Invalid state structure');
            return null;
        }

        // Verify signature
        const expectedSig = createHmac('sha256', getStateSecret())
            .update(wrapped.p)
            .digest('base64url');

        if (wrapped.s !== expectedSig) {
            console.warn('[OAuth] State signature mismatch - possible tampering');
            return null;
        }

        // Parse the payload
        const payload = JSON.parse(wrapped.p);
        console.log('[OAuth] Verified state:', payload);

        return {
            tenantDomain: payload.t || '',
            returnUrl: payload.r || '/',
        };
    } catch (e) {
        console.warn('[OAuth] Failed to verify state:', e);
        return null;
    }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    constructor() {
        super();
    }

    getAuthenticateOptions(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        // Get tenant domain from query param or x-forwarded-host
        const rawDomain = request.query.tenant ||
            request.headers['x-forwarded-host'] ||
            request.headers.host || '';

        // Strip port and normalize
        const tenantDomain = rawDomain.split(':')[0].toLowerCase();

        // Get return path from query
        const returnPath = request.query.returnUrl || '/';

        // Create signed state - single base64url string, NO DOTS
        const state = signOAuthState(tenantDomain, returnPath);

        console.log('[OAuth] Final state for passport:', state.substring(0, 50) + '...');

        // Return options with REQUIRED modern OAuth params
        // Google now rejects legacy OAuth flows without these
        return {
            state,
            accessType: 'offline',        // Required for modern OAuth
            prompt: 'consent',             // Required for modern OAuth
            includeGrantedScopes: true,    // Best practice
        };
    }

    handleRequest<TUser = any>(err: any, user: TUser): TUser {
        if (err || !user) {
            throw err;
        }
        return user;
    }
}

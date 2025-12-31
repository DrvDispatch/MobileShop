import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';

// Simple in-memory store for OAuth states (use Redis in production for multi-instance)
const oauthStateStore = new Map<string, { tenantDomain: string; returnUrl: string; expiresAt: Date }>();

/**
 * Google OAuth Service using google-auth-library directly
 * This bypasses Passport and gives us full control over the OAuth flow
 */
@Injectable()
export class GoogleOAuthService {
    private readonly logger = new Logger(GoogleOAuthService.name);
    private readonly oauth2Client: OAuth2Client;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly callbackUrl: string;

    constructor(private configService: ConfigService) {
        this.clientId = configService.get<string>('GOOGLE_CLIENT_ID')!;
        this.clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET')!;
        this.callbackUrl = configService.get<string>('GOOGLE_CALLBACK_URL')!;

        this.oauth2Client = new OAuth2Client(
            this.clientId,
            this.clientSecret,
            this.callbackUrl,
        );

        this.logger.log(`Google OAuth initialized with callback: ${this.callbackUrl}`);

        // Clean up expired states periodically
        setInterval(() => this.cleanupExpiredStates(), 60000);
    }

    /**
     * Generate a simple random state token and store tenant info server-side
     */
    createOAuthState(tenantDomain: string, returnUrl: string): string {
        // Generate simple alphanumeric state (no special characters)
        const state = randomBytes(16).toString('hex');

        // Store tenant info server-side (expires in 10 minutes)
        oauthStateStore.set(state, {
            tenantDomain,
            returnUrl,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        this.logger.log(`Created OAuth state: ${state} for tenant: ${tenantDomain}`);
        return state;
    }

    /**
     * Retrieve tenant info from state token
     */
    getStateData(state: string): { tenantDomain: string; returnUrl: string } | null {
        const data = oauthStateStore.get(state);

        if (!data) {
            this.logger.warn(`OAuth state not found: ${state}`);
            return null;
        }

        if (data.expiresAt < new Date()) {
            this.logger.warn(`OAuth state expired: ${state}`);
            oauthStateStore.delete(state);
            return null;
        }

        // Delete after use (one-time use)
        oauthStateStore.delete(state);

        this.logger.log(`Retrieved OAuth state: ${state} for tenant: ${data.tenantDomain}`);
        return { tenantDomain: data.tenantDomain, returnUrl: data.returnUrl };
    }

    /**
     * Clean up expired states
     */
    private cleanupExpiredStates(): void {
        const now = new Date();
        for (const [state, data] of oauthStateStore.entries()) {
            if (data.expiresAt < now) {
                oauthStateStore.delete(state);
            }
        }
    }

    /**
     * Generate the Google OAuth authorization URL MANUALLY
     * Matches the exact format that worked in direct testing
     * IMPORTANT: Don't use URLSearchParams - it over-encodes redirect_uri
     */
    generateAuthUrl(state: string): string {
        // Build URL manually with proper encoding
        // Note: redirect_uri should NOT have colons and slashes encoded
        const params = [
            `client_id=${this.clientId}`,
            `redirect_uri=${this.callbackUrl}`,  // Raw URL, not encoded
            `response_type=code`,
            `scope=${encodeURIComponent('email profile')}`,
            `state=${state}`,
            `access_type=offline`,
            `prompt=consent`,
        ].join('&');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

        this.logger.log(`Generated auth URL: ${authUrl}`);
        return authUrl;
    }

    /**
     * Exchange authorization code for tokens and get user profile
     */
    async handleCallback(code: string): Promise<{
        googleId: string;
        email: string;
        name: string;
        avatar?: string;
    }> {
        // Exchange code for tokens
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);

        // Verify the ID token and get user info
        const ticket = await this.oauth2Client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: this.clientId,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Failed to get user payload from Google token');
        }

        this.logger.log(`Verified Google user: ${payload.email}`);

        return {
            googleId: payload.sub,
            email: payload.email!,
            name: payload.name || payload.email!,
            avatar: payload.picture,
        };
    }
}

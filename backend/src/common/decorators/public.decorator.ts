/**
 * Public Endpoint Decorator
 * 
 * Mark endpoints as publicly accessible (no auth required).
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as public (no authentication required)
 * Usage: @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

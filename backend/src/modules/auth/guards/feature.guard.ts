import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TenantFeatures } from '../../tenant/tenant.middleware.js';

/**
 * Feature flag keys that can be used with @RequireFeature() decorator
 */
export type FeatureKey = keyof TenantFeatures;

/**
 * Parent features and their child features
 * Rule: If parent is OFF, all children are implicitly OFF
 */
const PARENT_CHILD_RELATIONS: Record<string, string[]> = {
    ecommerceEnabled: ['refurbishedGrading', 'wishlistEnabled', 'stockNotifications', 'couponsEnabled'],
    repairsEnabled: ['quoteOnRequest', 'mailInRepairs', 'walkInQueue'],
    ticketsEnabled: ['liveChatWidget'],
    invoicingEnabled: ['vatCalculation', 'pdfGeneration'],
    inventoryEnabled: ['advancedInventory'],
};

/**
 * Find parent feature for a child feature
 */
function getParentFeature(childFeature: string): string | null {
    for (const [parent, children] of Object.entries(PARENT_CHILD_RELATIONS)) {
        if (children.includes(childFeature)) {
            return parent;
        }
    }
    return null;
}

/**
 * Decorator to mark routes with required features
 * Usage: @RequireFeature('ecommerceEnabled')
 */
export const FEATURE_KEY = 'required_feature';
export const RequireFeature = (feature: FeatureKey) => SetMetadata(FEATURE_KEY, feature);

/**
 * Guard that checks if the required feature is enabled for the tenant
 * 
 * Rules:
 * 1. If feature is a parent and it's OFF → 403
 * 2. If feature is a child and parent is OFF → 403 (parent gates children)
 * 3. If feature is a child and child is OFF → 403
 */
@Injectable()
export class FeatureGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredFeature = this.reflector.getAllAndOverride<FeatureKey>(FEATURE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no feature required, allow access
        if (!requiredFeature) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const features = request.features as TenantFeatures | undefined;

        // If no features attached (e.g., owner routes), allow access
        if (!features) {
            return true;
        }

        // Check parent first (parent gates children)
        const parentFeature = getParentFeature(requiredFeature);
        if (parentFeature) {
            const parentEnabled = features[parentFeature as FeatureKey];
            if (!parentEnabled) {
                throw new ForbiddenException({
                    statusCode: 403,
                    message: `This feature is not available in your current plan`,
                    error: 'Feature Disabled',
                    code: 'FEATURE_DISABLED',
                    feature: parentFeature,
                });
            }
        }

        // Check the specific feature
        const featureEnabled = features[requiredFeature];
        if (!featureEnabled) {
            throw new ForbiddenException({
                statusCode: 403,
                message: `This feature is not available in your current plan`,
                error: 'Feature Disabled',
                code: 'FEATURE_DISABLED',
                feature: requiredFeature,
            });
        }

        return true;
    }
}

/**
 * Helper function to check if a feature is enabled (for use in services)
 * Respects parent-child relationships
 */
export function isFeatureEnabled(features: TenantFeatures | undefined, feature: FeatureKey): boolean {
    if (!features) return true; // No features = default allow

    // Check parent first
    const parentFeature = getParentFeature(feature);
    if (parentFeature && !features[parentFeature as FeatureKey]) {
        return false;
    }

    return Boolean(features[feature]);
}

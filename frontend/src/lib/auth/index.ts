/**
 * Authentication Module - Public API
 * 
 * Exports all auth-related business logic for use by UI components.
 */

export { useAuth } from './useAuth';

export type {
    User,
    AuthState,
    AuthResult,
    UseAuthReturn,
} from './useAuth';

// Re-export token utilities
export { saveToken, getToken, removeToken } from '../api';

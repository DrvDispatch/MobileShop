import React from 'react';
import { TenantStatus, DomainVerificationStatus } from '@/types';

// Allow raw string literals for user status
type UserStatus = 'ACTIVE' | 'INACTIVE';

interface StatusBadgeProps {
    status: TenantStatus | DomainVerificationStatus | UserStatus;
    className?: string;
    size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
    const getStatusClass = () => {
        switch (status) {
            case TenantStatus.DRAFT:
                return 'status-draft';
            case TenantStatus.ACTIVE:
            case 'ACTIVE':
                return 'status-active';
            case TenantStatus.SUSPENDED:
                return 'status-suspended';
            case TenantStatus.ARCHIVED:
            case 'INACTIVE':
                return 'status-archived';
            case DomainVerificationStatus.PENDING:
                return 'verification-pending';
            case DomainVerificationStatus.VERIFIED:
                return 'verification-verified';
            case DomainVerificationStatus.FAILED:
                return 'verification-failed';
            default:
                return 'status-draft';
        }
    };

    return (
        <span className={`status-badge ${getStatusClass()} ${className}`}>
            {status}
        </span>
    );
};

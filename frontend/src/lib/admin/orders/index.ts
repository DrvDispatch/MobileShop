/**
 * Orders Admin Module Index
 * 
 * Re-exports all order-related types, hooks, and utilities.
 */

// Types (full Order type for detail page)
export * from './types';

// Configs
export * from './configs';

// Hooks
export { useOrders, ORDER_STATUS_CONFIGS, playNotificationSound, getTimeAgo } from './useOrders';
export type { OrderListItem } from './useOrders';
export { useOrderDetail } from './useOrderDetail';
export type { UseOrderDetailReturn } from './useOrderDetail';
export type { UseOrdersReturn } from './useOrders';

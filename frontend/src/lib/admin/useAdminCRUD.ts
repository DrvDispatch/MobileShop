/**
 * Admin CRUD Hook
 * 
 * Combines data fetching with create, update, delete operations.
 * Provides optimistic updates and confirmation dialogs.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useCallback, useState } from 'react';
import { useAdminDataFetching, type UseAdminDataFetchingOptions } from './useAdminDataFetching';
import { adminFetch, type AdminApiError } from './adminApi';

export interface UseAdminCRUDOptions<T, R = T[]> extends UseAdminDataFetchingOptions<T, R> {
    /** Endpoint for CRUD operations (defaults to same as fetch endpoint) */
    crudEndpoint?: string;

    /** Name of the entity for confirmation dialogs */
    entityName?: string;

    /** Get display name from item for confirmation */
    getItemName?: (item: T) => string;
}

export interface UseAdminCRUDReturn<T> {
    /** All data fetching returns */
    data: T[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: AdminApiError | null;
    refresh: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T[]>>;

    /** CRUD operation states */
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;

    /** Create new item */
    create: (data: Omit<T, 'id'>) => Promise<T | null>;

    /** Update existing item */
    update: (id: string, data: Partial<T>) => Promise<T | null>;

    /** Delete item with confirmation */
    deleteItem: (item: T) => Promise<boolean>;

    /** Delete item by id with custom confirmation message */
    deleteById: (id: string, confirmMessage?: string) => Promise<boolean>;

    /** Bulk delete items */
    bulkDelete: (ids: string[], confirmMessage?: string) => Promise<boolean>;
}

export function useAdminCRUD<T extends { id: string }, R = T[]>(
    options: UseAdminCRUDOptions<T, R>
): UseAdminCRUDReturn<T> {
    const {
        crudEndpoint,
        entityName = 'item',
        getItemName = () => entityName,
        ...fetchOptions
    } = options;

    const endpoint = crudEndpoint || fetchOptions.endpoint;

    const {
        data,
        isLoading,
        isRefreshing,
        error,
        refresh,
        setData,
        removeItem,
        updateItem,
        addItem,
    } = useAdminDataFetching<T, R>(fetchOptions);

    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const create = useCallback(async (createData: Omit<T, 'id'>): Promise<T | null> => {
        setIsCreating(true);
        try {
            const newItem = await adminFetch<T>(endpoint, {
                method: 'POST',
                body: JSON.stringify(createData),
            });
            addItem(newItem);
            return newItem;
        } catch (err) {
            console.error('Create failed:', err);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [endpoint, addItem]);

    const update = useCallback(async (id: string, updateData: Partial<T>): Promise<T | null> => {
        setIsUpdating(true);
        try {
            const updated = await adminFetch<T>(`${endpoint}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData),
            });
            updateItem(id, updated);
            return updated;
        } catch (err) {
            console.error('Update failed:', err);
            return null;
        } finally {
            setIsUpdating(false);
        }
    }, [endpoint, updateItem]);

    const deleteById = useCallback(async (id: string, confirmMessage?: string): Promise<boolean> => {
        const message = confirmMessage || `Weet je zeker dat je dit ${entityName} wilt verwijderen?`;
        if (!confirm(message)) return false;

        setIsDeleting(true);
        try {
            await adminFetch<void>(`${endpoint}/${id}`, {
                method: 'DELETE',
            });
            removeItem(id);
            return true;
        } catch (err) {
            console.error('Delete failed:', err);
            alert(`Verwijderen mislukt`);
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [endpoint, entityName, removeItem]);

    const deleteItem = useCallback(async (item: T): Promise<boolean> => {
        const name = getItemName(item);
        return deleteById(item.id, `Weet je zeker dat je "${name}" wilt verwijderen?`);
    }, [deleteById, getItemName]);

    const bulkDelete = useCallback(async (ids: string[], confirmMessage?: string): Promise<boolean> => {
        const message = confirmMessage || `Weet je zeker dat je ${ids.length} ${entityName}(s) wilt verwijderen?`;
        if (!confirm(message)) return false;

        setIsDeleting(true);
        try {
            await Promise.all(ids.map(id =>
                adminFetch<void>(`${endpoint}/${id}`, { method: 'DELETE' })
            ));
            ids.forEach(id => removeItem(id));
            return true;
        } catch (err) {
            console.error('Bulk delete failed:', err);
            alert(`Verwijderen mislukt`);
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [endpoint, entityName, removeItem]);

    return {
        // Data fetching
        data,
        isLoading,
        isRefreshing,
        error,
        refresh,
        setData,

        // CRUD states
        isCreating,
        isUpdating,
        isDeleting,

        // CRUD operations
        create,
        update,
        deleteItem,
        deleteById,
        bulkDelete,
    };
}

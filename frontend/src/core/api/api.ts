/**
 * @core-only
 * 
 * This module is part of the CORE layer. It handles all API communication
 * and data fetching. Skins must NOT import from this file directly.
 * 
 * Skins receive data through view-model props prepared by core hooks.
 * If a skin needs data not available in the view-model, the core layer
 * must be extended first.
 */

// API base URL - use empty string so requests go through Next.js rewrite proxy
// This preserves the Host header for proper multi-tenant resolution
const API_URL = '';

interface ApiError {
    message: string;
    statusCode: number;
}

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
        avatar?: string;
        phone?: string;
    };
}

interface MessageResponse {
    message: string;
    success: boolean;
}

// Product types
export type ProductType = 'PHONE' | 'PART' | 'ACCESSORY';
export type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C';

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    stockQty: number;
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    brand?: string;
    isFeatured: boolean;
    isActive: boolean;
    categoryId?: string;
    category?: Category;
    images: ProductImage[];
    createdAt: string;
    // Device specification fields
    productType?: ProductType;
    storage?: string;
    color?: string;
    batteryHealth?: number;
    deviceGrade?: DeviceGrade;
}


export interface ProductImage {
    id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string;
    children?: Category[];
    _count?: { products: number };
}

export interface ProductsResponse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProductQueryParams {
    category?: string;
    brand?: string;
    condition?: 'NEW' | 'USED' | 'REFURBISHED';
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Only send Authorization header if we have a real JWT token (not cookie-based)
        if (token && token !== 'cookie-based') {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Always include cookies for cookie-based auth
        });

        const data = await response.json();

        if (!response.ok) {
            const error: ApiError = {
                message: data.message || 'An error occurred',
                statusCode: response.status,
            };
            throw error;
        }

        return data as T;
    }

    // Auth endpoints
    async register(email: string, password: string, name: string, phone?: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, phone }),
        });
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async verifyEmail(token: string): Promise<MessageResponse> {
        return this.request<MessageResponse>('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async resendVerification(email: string): Promise<MessageResponse> {
        return this.request<MessageResponse>('/api/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async forgotPassword(email: string): Promise<MessageResponse> {
        return this.request<MessageResponse>('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, password: string): Promise<MessageResponse> {
        return this.request<MessageResponse>('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }

    async getMe(): Promise<AuthResponse['user']> {
        return this.request<AuthResponse['user']>('/api/auth/me');
    }

    getGoogleAuthUrl(returnUrl: string = '/'): string {
        // IMPORTANT: For Google OAuth, we need to bypass the proxy completely
        // The proxy interferes with Google's redirect chain causing 400 errors
        // Use the same origin as the current page (which goes through Cloudflare tunnel in production)
        const tenant = typeof window !== 'undefined' ? window.location.host : '';
        const params = new URLSearchParams({
            tenant,
            returnUrl,
        });

        // In browser, use window origin (respects Cloudflare tunnel)
        // The key is to NOT go through Next.js API routes
        if (typeof window !== 'undefined') {
            // Use current origin - Cloudflare tunnel will route this correctly
            return `${window.location.origin}/api/auth/google?${params.toString()}`;
        }

        return `${this.baseUrl}/api/auth/google?${params.toString()}`;
    }

    // Appointments endpoints
    async getMyAppointments(): Promise<Array<{
        id: string;
        customerName: string;
        deviceBrand: string;
        deviceModel: string;
        repairType: string;
        problemDescription: string;
        appointmentDate: string;
        timeSlot: string;
        status: string;
        createdAt: string;
    }>> {
        return this.request('/api/appointments/my');
    }
    async getProducts(params?: ProductQueryParams): Promise<ProductsResponse> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.set(key, String(value));
                }
            });
        }
        const query = searchParams.toString();
        return this.request<ProductsResponse>(`/api/products${query ? `?${query}` : ''}`);
    }

    async getFeaturedProducts(limit = 4): Promise<Product[]> {
        return this.request<Product[]>(`/api/products/featured?limit=${limit}`);
    }

    async getProduct(idOrSlug: string): Promise<Product> {
        return this.request<Product>(`/api/products/${idOrSlug}`);
    }

    async getBrands(): Promise<string[]> {
        return this.request<string[]>('/api/products/brands');
    }

    async getRelatedProducts(productId: string, limit = 8): Promise<Product[]> {
        return this.request<Product[]>(`/api/products/${productId}/related?limit=${limit}`);
    }

    // Upload endpoints
    async uploadImage(file: File): Promise<{ url: string; key: string }> {
        const token = this.getToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/api/upload/image`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw { message: data.message || 'Upload failed', statusCode: response.status };
        }
        return data;
    }

    async uploadImages(files: File[]): Promise<{ url: string; key: string }[]> {
        const token = this.getToken();
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const response = await fetch(`${this.baseUrl}/api/upload/images`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw { message: data.message || 'Upload failed', statusCode: response.status };
        }
        return data;
    }

    // Categories endpoints
    async getCategories(): Promise<Category[]> {
        return this.request<Category[]>('/api/categories');
    }

    async getCategory(idOrSlug: string): Promise<Category> {
        return this.request<Category>(`/api/categories/${idOrSlug}`);
    }

    // Admin: Product CRUD
    async createProduct(data: {
        name: string;
        slug?: string;
        description?: string;
        shortDescription?: string;
        price: number;
        compareAtPrice?: number;
        stockQty: number;
        condition: 'NEW' | 'USED' | 'REFURBISHED';
        brand?: string;
        categoryId?: string;
        isFeatured?: boolean;
        isActive?: boolean;
        imageUrls?: string[];
        storage?: string;
        color?: string;
        batteryHealth?: number;
        deviceGrade?: string;
    }): Promise<Product> {
        return this.request<Product>('/api/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id: string, data: Partial<{
        name: string;
        slug: string;
        description: string;
        shortDescription: string;
        price: number;
        compareAtPrice: number;
        stockQty: number;
        condition: 'NEW' | 'USED' | 'REFURBISHED';
        brand: string;
        categoryId: string;
        isFeatured: boolean;
        isActive: boolean;
        storage: string;
        color: string;
        batteryHealth: number;
        deviceGrade: string;
        imageUrls: string[];
    }>): Promise<Product> {
        return this.request<Product>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id: string): Promise<void> {
        return this.request<void>(`/api/products/${id}`, {
            method: 'DELETE',
        });
    }

    // Admin: Category CRUD
    async createCategory(data: {
        name: string;
        slug?: string;
        description?: string;
        image?: string;
        parentId?: string;
    }): Promise<Category> {
        return this.request<Category>('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCategory(id: string, data: Partial<{
        name: string;
        slug: string;
        description: string;
        image: string;
        parentId: string;
    }>): Promise<Category> {
        return this.request<Category>(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCategory(id: string): Promise<void> {
        return this.request<void>(`/api/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // Orders / Checkout endpoints
    async createCheckout(data: {
        items: { productId: string; name: string; price: number; quantity: number; image?: string }[];
        customerEmail: string;
        customerName: string;
        customerPhone?: string;
        fulfillmentType?: 'SHIPPING' | 'PICKUP';
        shippingAddress?: {
            line1: string;
            line2?: string;
            city: string;
            state?: string;
            postalCode: string;
            country: string;
        };
    }): Promise<{ checkoutUrl: string; sessionId: string }> {
        return this.request<{ checkoutUrl: string; sessionId: string }>('/api/orders/checkout', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getOrderBySession(sessionId: string): Promise<{
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        customerEmail: string;
        customerName: string;
        items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
        createdAt: string;
    }> {
        return this.request(`/api/orders/by-session?sessionId=${sessionId}`);
    }

    async getMyOrders(email: string): Promise<{
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        createdAt: string;
        items: { productName: string; quantity: number }[];
    }[]> {
        return this.request(`/api/orders/my-orders?email=${encodeURIComponent(email)}`);
    }

    async getOrderById(id: string): Promise<{
        id: string;
        orderNumber: string;
        status: string;
        total: number;
        subtotal?: number;
        shippingCost?: number;
        customerEmail: string;
        customerName: string;
        customerPhone?: string;
        shippingAddress?: {
            line1: string;
            line2?: string;
            city: string;
            state?: string;
            postalCode: string;
            country: string;
        };
        items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
        createdAt: string;
        updatedAt: string;
    }> {
        return this.request(`/api/orders/${id}`);
    }
}

export const api = new ApiClient(API_URL);

// Auth helpers
export const saveToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
    }
};

export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
    }
};

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export type { AuthResponse, MessageResponse, ApiError };

/**
 * Helper function for admin API calls that uses relative URLs
 * to go through the Next.js proxy for proper tenant resolution.
 * 
 * IMPORTANT: Do NOT use direct API URLs like localhost:3001 in admin pages.
 * Always use this helper or relative paths (/api/...) to ensure the
 * Host header is preserved for multi-tenant resolution.
 */
export const adminFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Ensure endpoint starts with /api
    const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Get admin token if not provided in headers
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

    const headers: HeadersInit = {
        ...options.headers,
    };

    // Add auth header if we have a token and it's not already set
    if (token && !('Authorization' in headers)) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON body if not set
    if (options.body && typeof options.body === 'string' && !('Content-Type' in headers)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    return fetch(path, {
        ...options,
        headers,
    });
};

/**
 * Returns the admin auth headers for fetch calls
 */
export const getAdminHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};


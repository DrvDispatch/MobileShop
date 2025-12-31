const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include', // Important for HttpOnly cookies
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Try to parse error response, but handle empty bodies
                const text = await response.text();
                if (text) {
                    const error: ApiError = JSON.parse(text);
                    throw new Error(error.message || 'An error occurred');
                }
                throw new Error(`Request failed with status ${response.status}`);
            }

            // Handle 204 No Content (no body to parse)
            if (response.status === 204) {
                return undefined as T;
            }

            // Check if there's content to parse
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0') {
                return undefined as T;
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An unexpected error occurred');
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient(API_URL);

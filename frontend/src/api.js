import axios from 'axios';
import { supabase, getAccessToken } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.careersea.in';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Attach the Supabase access token to every outgoing request automatically.
api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// On 401, refresh the Supabase session once and retry; on failure, sign out.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data, error: refreshError } = await supabase.auth.refreshSession();
                const token = data?.session?.access_token;

                if (refreshError || !token) throw refreshError ?? new Error('No active session');

                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                await supabase.auth.signOut();
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

/**
 * Extracts a human-readable message from an API error.
 * The Worker returns several shapes: { detail }, { error }, or per-field
 * arrays such as { password: ['...'] }. Never discard these silently.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    const data = error?.response?.data;

    if (data && typeof data === 'object') {
        if (typeof data.detail === 'string' && data.detail) return data.detail;
        for (const field of ['email', 'password', 'answers', 'text']) {
            const value = data[field];
            if (Array.isArray(value) && value.length > 0) return String(value[0]);
            if (typeof value === 'string' && value) return value;
        }
        if (typeof data.error === 'string' && data.error) return data.error;
    }

    if (error?.message === 'Network Error') {
        return 'Cannot reach the server. Please check your connection.';
    }

    return fallback;
}

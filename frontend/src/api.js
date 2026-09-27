import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.careersea.in';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Refresh tokens are HttpOnly cookies; remove any legacy browser copy.
localStorage.removeItem('refresh_token');

// Attach the access token to every outgoing request automatically
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// On 401, attempt one token refresh then retry; on second failure, log out
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue the request until the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {}, { withCredentials: true });

                const newAccessToken = response.data.access;
                sessionStorage.setItem('access_token', newAccessToken);

                // Update the default header and retry queued requests
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                sessionStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
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
        for (const field of ['username', 'email', 'password', 'answers', 'text']) {
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

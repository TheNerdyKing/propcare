import axios from 'axios';

const getBaseURL = () => {
    // 1. Check for environment variable (most reliable)
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    // 2. Handle browser environment logic
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Vercel Production - Force the known backend endpoint
        if (hostname.includes('vercel.app')) {
            // If we're on the frontend domain, point to the dedicated api domain
            if (hostname === 'propcare.vercel.app') {
                return 'https://propcare-api.vercel.app';
            }
            // Fallback for previews or custom domains: try to append -api
            return `https://${hostname.replace('.vercel.app', '-api.vercel.app')}`;
        }
    }

    // Default for server-side or unknown
    return 'https://propcare-api.vercel.app';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle token refresh logic here later
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

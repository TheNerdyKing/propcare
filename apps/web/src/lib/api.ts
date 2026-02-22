import axios from 'axios';

const getBaseURL = () => {
    // 1. Explicit env var is always highest priority
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    // 2. Browser detection
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Vercel Strategy: If frontend is "xxx.vercel.app", 
        // backend is usually "xxx-api.vercel.app".
        if (hostname.endsWith('.vercel.app')) {
            const base = hostname.replace('.vercel.app', '');
            // Prevent double -api if they are already on an -api domain somehow
            if (!base.endsWith('-api')) {
                return `https://${base}-api.vercel.app`;
            }
        }
    }

    // Static Fallback as last resort
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

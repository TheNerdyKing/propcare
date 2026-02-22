import axios from 'axios';

const getBaseURL = () => {
    // 1. Explicit env var (Best for Vercel Dashboard)
    if (process.env.NEXT_PUBLIC_API_URL) {
        const url = process.env.NEXT_PUBLIC_API_URL;
        return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
    }

    // 2. Browser detection
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001/api';
        }

        // Vercel Strategy
        if (hostname.endsWith('.vercel.app')) {
            // If we are on the frontend (e.g., propcare.vercel.app), 
            // the backend is likely at propcare-api.vercel.app/api
            if (!hostname.includes('-api.')) {
                const base = hostname.replace('.vercel.app', '');
                return `https://${base}-api.vercel.app/api`;
            }

            // If we are ALREADY on the -api domain but see the UI, 
            // then the API must be at the same domain/api
            return `https://${hostname}/api`;
        }
    }

    // Static Fallback
    return 'https://propcare-api.vercel.app/api';
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

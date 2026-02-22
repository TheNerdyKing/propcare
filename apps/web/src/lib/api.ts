import axios from 'axios';

const getBaseURL = () => {
    // 1. Explicit env var (Best for Vercel Dashboard)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }

    // 2. Browser detection
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Vercel Strategy
        if (hostname.endsWith('.vercel.app')) {
            // If we are on the frontend (e.g., propcare.vercel.app), 
            // the backend is likely at propcare-api.vercel.app
            if (!hostname.includes('-api.')) {
                const base = hostname.replace('.vercel.app', '');
                return `https://${base}-api.vercel.app`;
            }

            // If we are ALREADY on the -api domain but see the UI
            return `https://${hostname}`;
        }
    }

    // Static Fallback
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

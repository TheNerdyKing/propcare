import axios from 'axios';

const getBaseURL = () => {
    // We are consolidating all backend logic into Next.js API routes (apps/web/src/app/api)
    // This allows us to use Supabase as the primary backend + Next.js Serverless Functions for AI.
    return '/api/';
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

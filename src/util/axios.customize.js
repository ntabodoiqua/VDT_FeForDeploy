import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 60000, // 1 minute default timeout
    maxContentLength: 500 * 1024 * 1024, // 500MB max content length
    maxBodyLength: 500 * 1024 * 1024 // 500MB max body length
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};


// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Không thêm token cho login, register và refresh token
    const noAuthPaths = [
        'lms/auth/token',
        'lms/users',
        'lms/auth/refresh'
    ];

    // Check if the URL is for a public resource or in the noAuthPaths list
    const isPublicPath = config.url.includes('/public/');
    const isNoAuthPath = noAuthPaths.some(path => config.url.startsWith(path));

    // Nếu url không phải public và không nằm trong danh sách noAuthPaths thì thêm token
    if (!isPublicPath && !isNoAuthPath) {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    if (response && response.data) return response.data;
    return response;
}, function (error) {
    const originalRequest = error.config;

    // Kiểm tra lỗi 401 và không phải là request refresh token
    if (error.response?.status === 401 && originalRequest.url !== 'lms/auth/refresh') {
        if (isRefreshing) {
            return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
            })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return instance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise(async (resolve, reject) => {
            try {
                const { result } = await instance.post('lms/auth/refresh', {
                    token: localStorage.getItem('access_token')
                });
                const newAccessToken = result.token;
                localStorage.setItem('access_token', newAccessToken);
                instance.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                processQueue(null, newAccessToken);
                resolve(instance(originalRequest));
            } catch (e) {
                processQueue(e, null);
                localStorage.removeItem('access_token');
                // Chuyển hướng về trang login nếu cần
                // window.location.href = '/login';
                reject(e);
            } finally {
                isRefreshing = false;
            }
        });
    }

    if (error?.response?.data) return error?.response?.data;
    return Promise.reject(error);
});

export default instance;
import axios from "axios";
// Set config defaults when creating the instance
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL
});

// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Không thêm token cho login và register
    const noAuthPaths = [
        '/auth/token',
        '/users'
    ];
    // Nếu url không nằm trong danh sách noAuthPaths thì thêm token
    if (!noAuthPaths.some(path => config.url && config.url.startsWith(path))) {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Xóa Authorization nếu không có token
            delete config.headers.Authorization;
        }
    } else {
        // Đảm bảo không có Authorization cho login/register
        delete config.headers.Authorization;
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
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error?.response?.data) return error?.response?.data;
    return Promise.reject(error);
});

export default instance;
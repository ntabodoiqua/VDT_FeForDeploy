import axios from './axios.customize';

// Đăng nhập
const loginApi = (username, password) => {
    return axios.post('lms/auth/token', { username, password });
}

// Đăng ký
const createUserApi = (userData) => {
    return axios.post('lms/users', userData);
}

// User Management API calls
const fetchUsersApi = (params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/admin/manage-users?${queryParams.toString()}`);
};

const updateUserStatusApi = (userId, action) => {
    return axios.put(`/lms/admin/manage-users/${userId}/${action}`);
};

const updateUserDetailsApi = (userId, payload) => {
    return axios.put(`/lms/admin/manage-users/${userId}`, payload);
};

const changeUserPasswordApi = (userId, payload) => {
    return axios.put(`/lms/admin/manage-users/${userId}/change-password`, payload);
};

const deleteUserApi = (userId) => {
    return axios.delete(`/lms/admin/manage-users/${userId}`);
};

const fetchUserStatisticsApi = () => {
    return axios.get('/lms/statistics/overview');
};

export {
    createUserApi, loginApi,
    fetchUsersApi,
    updateUserStatusApi,
    updateUserDetailsApi,
    changeUserPasswordApi,
    deleteUserApi,
    fetchUserStatisticsApi
}
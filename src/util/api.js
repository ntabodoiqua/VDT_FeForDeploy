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

// Course Management API calls
const fetchCoursesApi = (params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/courses?${queryParams.toString()}`);
};

const fetchCourseByIdApi = (courseId) => {
    return axios.get(`/lms/courses/${courseId}`);
};

const createCourseApi = (courseData) => {
    return axios.post('/lms/courses', courseData);
};

const updateCourseApi = (courseId, formData) => {
    return axios.put(`/lms/courses/${courseId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const deleteCourseApi = (courseId) => {
    return axios.delete(`/lms/courses/${courseId}`);
};

const toggleCourseStatusApi = (courseId, payload) => {
    // Sử dụng endpoint PATCH toggle-status mới
    return axios.patch(`/lms/courses/${courseId}/toggle-status`, payload);
};

// Category Management API calls
const fetchCategoriesApi = (params) => {
    const queryParams = new URLSearchParams(params);
    // Assuming the backend base path for category is /category based on CategoryController
    return axios.get(`/lms/category?${queryParams.toString()}`);
};

const fetchCategoryByIdApi = (categoryId) => {
    return axios.get(`/lms/category/${categoryId}`);
};

const createCategoryApi = (categoryData) => {
    return axios.post('/lms/category', categoryData);
};

const updateCategoryApi = (categoryId, categoryData) => {
    return axios.put(`/lms/category/${categoryId}`, categoryData);
};

const deleteCategoryApi = (categoryId) => {
    return axios.delete(`/lms/category/${categoryId}`);
};

export {
    createUserApi, loginApi,
    fetchUsersApi,
    updateUserStatusApi,
    updateUserDetailsApi,
    changeUserPasswordApi,
    deleteUserApi,
    fetchUserStatisticsApi,
    fetchCoursesApi,
    fetchCourseByIdApi,
    createCourseApi,
    updateCourseApi,
    deleteCourseApi,
    toggleCourseStatusApi,
    // Category exports
    fetchCategoriesApi,
    fetchCategoryByIdApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi
}
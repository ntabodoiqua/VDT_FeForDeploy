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

// API to fetch lessons for a specific course
const fetchLessonsForCourseApi = (courseId, params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/courses/${courseId}/lessons?${queryParams.toString()}`);
};

// API to add a lesson to a course
const addLessonToCourseApi = (courseId, courseLessonRequest) => {
    return axios.post(`/lms/courses/${courseId}/lessons`, courseLessonRequest);
};

// API to fetch all lessons in the system (for LessonManagement page and modals)
const fetchAllSystemLessonsApi = (params) => {
    const queryParams = new URLSearchParams(params); // params typically { page: 0, size: 10 }
    return axios.get(`/lms/lessons?${queryParams.toString()}`);
};

// API to remove a lesson from a course
const removeLessonFromCourseApi = (courseId, courseLessonId) => {
    return axios.delete(`/lms/courses/${courseId}/lessons/${courseLessonId}`);
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

// API to fetch a single lesson by its ID
const fetchLessonByIdApi = (lessonId) => {
    return axios.get(`/lms/lessons/${lessonId}`);
};

// Lấy thông tin chi tiết của một lesson cụ thể trong một khóa học
const fetchCourseLessonDetailsApi = (courseId, courseLessonId) => {
    return axios.get(`/lms/courses/${courseId}/lessons/${courseLessonId}`);
};

// API to update a specific lesson within a course
const updateCourseLessonApi = (courseId, courseLessonId, data) => {
    return axios.patch(`/lms/courses/${courseId}/lessons/${courseLessonId}`, data);
};

const updateLessonApi = (lessonId, lessonData) => {
    return axios.put(`/lms/lessons/${lessonId}`, lessonData);
};

const createLessonApi = (lessonData) => {
    return axios.post('/lms/lessons', lessonData);
}

const deleteLessonApi = (lessonId) => {
    return axios.delete(`/lms/lessons/${lessonId}`);
};

// Enrollment Management API calls
const fetchPendingEnrollmentsApi = (courseId, params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/enrollments/pending/course/${courseId}?${queryParams.toString()}`);
};

const fetchApprovedEnrollmentsApi = (courseId, params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/enrollments/approved/course/${courseId}?${queryParams.toString()}`);
};

const approveEnrollmentApi = (enrollmentId) => {
    return axios.put(`/lms/enrollments/${enrollmentId}/approve`);
};

const rejectEnrollmentApi = (enrollmentId) => {
    return axios.put(`/lms/enrollments/${enrollmentId}/reject`);
};

const fetchEnrollmentProgressApi = (enrollmentId) => {
    return axios.get(`/lms/enrollments/${enrollmentId}/progress`);
};

// Review Management API calls
const fetchPendingReviewsApi = (courseId, params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/course-reviews/unapproved/${courseId}?${queryParams.toString()}`);
};

// Lấy danh sách đánh giá đã được xử lý cho admin
const fetchHandledReviewsApi = (courseId, params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/course-reviews/handled/${courseId}?${queryParams.toString()}`);
};

const approveReviewApi = (reviewId) => {
    return axios.put(`/lms/course-reviews/approve/${reviewId}`);
};

const rejectReviewApi = (reviewId) => {
    return axios.put(`/lms/course-reviews/reject/${reviewId}`);
};

const fetchAllReviewsApi = (params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/course-reviews/all-for-admin?${queryParams.toString()}`);
}

const fetchAllEnrollmentsApi = (params) => {
    const queryParams = new URLSearchParams(params);
    return axios.get(`/lms/enrollments/all-for-admin?${queryParams.toString()}`);
}

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
    fetchLessonsForCourseApi,
    addLessonToCourseApi,
    fetchAllSystemLessonsApi,
    removeLessonFromCourseApi,
    // Category exports
    fetchCategoriesApi,
    fetchCategoryByIdApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
    fetchLessonByIdApi,
    fetchCourseLessonDetailsApi,
    updateCourseLessonApi,
    updateLessonApi,
    createLessonApi,
    deleteLessonApi,
    // Enrollments
    fetchPendingEnrollmentsApi,
    fetchApprovedEnrollmentsApi,
    approveEnrollmentApi,
    rejectEnrollmentApi,
    fetchEnrollmentProgressApi,
    // Reviews
    fetchPendingReviewsApi,
    fetchHandledReviewsApi,
    approveReviewApi,
    rejectReviewApi,
    fetchAllReviewsApi,
    fetchAllEnrollmentsApi,
}
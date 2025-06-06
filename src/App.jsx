import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './components/context/auth.context';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import AdminDashboard from './pages/admin/Dashboard';
import InstructorDashboard from './pages/instructor/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import LessonManagement from './pages/admin/LessonManagement';
import Statistics from './pages/admin/Statistics';
import CourseLessonManagement from './pages/admin/CourseLessonManagement';
import EnrollmentManagement from './pages/admin/EnrollmentManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import InstructorCourseManagement from './pages/instructor/CourseManagement';
import InstructorLessonManagement from './pages/instructor/LessonManagement';
import InstructorStatistics from './pages/instructor/Statistics';
import InstructorCourseLessonManagement from './pages/instructor/CourseLessonManagement';
import InstructorCategoryManagement from './pages/instructor/CategoryManagement';
import InstructorEnrollmentManagement from './pages/instructor/EnrollmentManagement';
import InstructorReviewManagement from './pages/instructor/ReviewManagement';
import StudentCourses from './pages/student/Courses';
import StudentCourseList from './pages/student/CourseList';
import StudentCourseDetail from './pages/student/CourseDetail';
import MyAccount from './pages/student/MyAccount';

function App() {
    const { auth } = useContext(AuthContext);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={!auth.isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
                <Route path="/register" element={!auth.isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />

                {/* Protected routes for ADMIN */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="courses" element={<CourseManagement />} />
                    <Route path="course-categories" element={<CategoryManagement />} />
                    <Route path="lessons" element={<LessonManagement />} />
                    <Route path="statistics" element={<Statistics />} />
                    <Route path="course-lesson-management" element={<CourseLessonManagement />} />
                    <Route path="enrollments" element={<EnrollmentManagement />} />
                    <Route path="reviews" element={<ReviewManagement />} />
                </Route>

                {/* Protected routes for INSTRUCTOR */}
                <Route path="/instructor" element={
                    <ProtectedRoute allowedRoles={['ROLE_INSTRUCTOR']}>
                        <InstructorDashboard />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="courses" replace />} />
                    <Route path="courses" element={<InstructorCourseManagement />} />
                    <Route path="course-categories" element={<InstructorCategoryManagement />} />
                    <Route path="lessons" element={<InstructorLessonManagement />} />
                    <Route path="statistics" element={<InstructorStatistics />} />
                    <Route path="course-lesson-management" element={<InstructorCourseLessonManagement />} />
                    <Route path="enrollments" element={<InstructorEnrollmentManagement />} />
                    <Route path="reviews" element={<InstructorReviewManagement />} />
                </Route>

                {/* Protected routes for STUDENT */}
                <Route path="/student" element={
                    <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                        <StudentDashboard />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="courses" replace />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="available-courses" element={<StudentCourseList />} />
                    <Route path="learning/:courseId" element={<StudentCourseDetail />} />
                    <Route path="my-account" element={<MyAccount />} />
                </Route>

                {/* Redirect root to appropriate dashboard based on role */}
                <Route path="/" element={
                    auth.isAuthenticated ? (
                        auth.role === 'ROLE_ADMIN' ? <Navigate to="/admin" replace /> :
                        auth.role === 'ROLE_INSTRUCTOR' ? <Navigate to="/instructor" replace /> :
                        <Navigate to="/student" replace />
                    ) : <Navigate to="/login" replace />
                } />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

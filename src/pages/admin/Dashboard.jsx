import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    UserOutlined,
    BookOutlined,
    FileTextOutlined,
    BarChartOutlined,
    LogoutOutlined,
    AppstoreOutlined,
    LinkOutlined,
    SolutionOutlined,
    MessageOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { useContext } from 'react';
import { AuthContext } from '../../components/context/auth.context';

import siteLogo from '../../assets/images/logo.png'; 

const { Header, Sider, Content } = Layout;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useContext(AuthContext);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setAuth({
            isAuthenticated: false,
            username: null,
            role: null,
            scope: null
        });
        navigate('/login');
    };

    const menuItems = [
        {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => navigate('/admin/users')
        },
        {
            key: 'newCourseLessonManagement',
            icon: <AppstoreOutlined />,
            label: 'Quản lý khóa học - bài học',
            children: [
                {
                    key: 'newCourseManagementSubmenu',
                    icon: <BookOutlined />,
                    label: 'Quản lý khóa học',
                    children: [
                        {
                            key: 'courses',
                            label: 'Danh sách khóa học',
                            onClick: () => navigate('/admin/courses'),
                        },
                        {
                            key: 'course-categories',
                            label: 'Quản lý danh mục',
                            onClick: () => navigate('/admin/course-categories'),
                        }
                    ]
                },
                {
                    key: 'lessons',
                    icon: <FileTextOutlined />,
                    label: 'Quản lý bài học',
                    onClick: () => navigate('/admin/lessons')
                },
                {
                    key: 'course-lesson-management',
                    icon: <LinkOutlined />,
                    label: 'Liên kết Khóa học - Bài học',
                    onClick: () => navigate('/admin/course-lesson-management')
                }
            ]
        },
        {
            key: 'studentEnrollmentReviewManagement',
            icon: <TeamOutlined />,
            label: 'Quản lý Ghi danh & Đánh giá',
            children: [
                {
                    key: 'enrollments',
                    icon: <SolutionOutlined />,
                    label: 'Quản lý Enrollment',
                    onClick: () => navigate('/admin/enrollments')
                },
                {
                    key: 'reviews',
                    icon: <MessageOutlined />,
                    label: 'Quản lý Review',
                    onClick: () => navigate('/admin/reviews')
                }
            ]
        },
        {
            key: 'statistics',
            icon: <BarChartOutlined />,
            label: 'Thống kê',
            onClick: () => navigate('/admin/statistics')
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout
        }
    ];

    const getSelectedKey = () => {
        const pathSegments = location.pathname.split('/');
        const mainPath = pathSegments[2] || 'users'; 
        let selected = mainPath;
        if (location.pathname.startsWith('/admin/courses')) selected = 'courses';
        if (location.pathname.startsWith('/admin/course-categories')) selected = 'course-categories';
        if (location.pathname.startsWith('/admin/lessons')) selected = 'lessons';
        if (location.pathname.startsWith('/admin/course-lesson-management')) selected = 'course-lesson-management';
        if (location.pathname.startsWith('/admin/enrollments')) selected = 'enrollments';
        if (location.pathname.startsWith('/admin/reviews')) selected = 'reviews';
        
        return selected;
    };

    const getDefaultOpenKeys = () => {
        const currentPath = location.pathname;
        if (currentPath.includes('/admin/courses') || currentPath.includes('/admin/course-categories') || currentPath.includes('/admin/lessons') || currentPath.includes('/admin/course-lesson-management')) {
            return ['newCourseLessonManagement', 'newCourseManagementSubmenu'];
        }
        if (currentPath.includes('/admin/enrollments') || currentPath.includes('/admin/reviews')) {
            return ['studentEnrollmentReviewManagement'];
        }
        return [];
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider 
                width={280} 
                theme="light"
                style={{
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000
                }}
            >
                <div 
                    style={{
                        height: '64px',
                        margin: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0',
                    }}
                >
                    {siteLogo ? 
                        <img src={siteLogo} alt="Logo Trang Web" style={{ height: '40px', maxWidth: '100%' }} /> : 
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#001529'}}>Logo</div>
                    }
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    defaultOpenKeys={getDefaultOpenKeys()}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: 280 }}>
                <Header style={{ background: '#fff', padding: 0, paddingLeft: 16 }}>
                    <h2>Trang quản trị</h2>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard; 
import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
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
    TeamOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    QuestionCircleOutlined,
    SolutionOutlined as UserManagementIcon,
} from '@ant-design/icons';
import { useContext } from 'react';
import { AuthContext } from '../../components/context/auth.context';

import siteLogo from '../../assets/images/logo.png'; 

const { Header, Sider, Content } = Layout;

const AdminDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
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
            key: 'instructor-management',
            icon: <UserManagementIcon />,
            label: 'Quản lý giảng viên',
            onClick: () => navigate('/admin/instructor-management')
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
                },
                {
                    key: 'quiz-management',
                    icon: <QuestionCircleOutlined />,
                    label: 'Quản lý Quiz',
                    onClick: () => navigate('/admin/quiz-management')
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
        if (location.pathname.startsWith('/admin/quiz-management') || location.pathname.startsWith('/admin/quiz-questions')) selected = 'quiz-management';
        if (location.pathname.startsWith('/admin/instructor-management')) selected = 'instructor-management';
        
        return selected;
    };

    const getDefaultOpenKeys = () => {
        const currentPath = location.pathname;
        if (currentPath.includes('/admin/courses') || currentPath.includes('/admin/course-categories') || currentPath.includes('/admin/lessons') || currentPath.includes('/admin/course-lesson-management') || currentPath.includes('/admin/quiz-management') || currentPath.includes('/admin/quiz-questions')) {
            return ['newCourseLessonManagement', 'newCourseManagementSubmenu'];
        }
        if (currentPath.includes('/admin/enrollments') || currentPath.includes('/admin/reviews')) {
            return ['studentEnrollmentReviewManagement'];
        }
        return [];
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Floating toggle button - always visible */}
            <Button
                type="primary"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: collapsed ? '20px' : '300px',
                    zIndex: 1001,
                    fontSize: '16px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'left 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={collapsed ? 'Mở sidebar' : 'Đóng sidebar'}
            />
            
            <Sider 
                width={280} 
                theme="light"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                style={{
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000,
                    transition: 'width 0.2s'
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
                    {!collapsed && (
                        <img src={siteLogo} alt="Logo" style={{ height: '40px', maxWidth: '100%' }} />
                    )}
                    {collapsed && (
                        <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    )}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    defaultOpenKeys={getDefaultOpenKeys()}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'margin-left 0.2s' }}>
                <Header style={{ 
                    background: '#fff', 
                    padding: 0, 
                    paddingLeft: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                                marginRight: 16
                            }}
                        />
                        <h2 style={{ margin: 0 }}>Trang quản trị</h2>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard; 
import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BookOutlined,
    FileTextOutlined,
    BarChartOutlined,
    LogoutOutlined,
    AppstoreOutlined,
    LinkOutlined,
    SolutionOutlined,
    UserOutlined,
    FolderOpenOutlined
} from '@ant-design/icons';
import { useContext } from 'react';
import { AuthContext } from '../../components/context/auth.context';
import logo from '../../assets/images/logo.png';

const { Header, Sider, Content } = Layout;

const InstructorDashboard = () => {
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
            key: 'course-lesson-management-group',
            icon: <AppstoreOutlined />,
            label: 'Quản lý khóa học - bài học',
            children: [
                {
                    key: 'course-management-submenu',
                    icon: <BookOutlined />,
                    label: 'Quản lý khóa học',
                    children: [
                        {
                            key: 'courses',
                            label: 'Danh sách khóa học',
                            onClick: () => navigate('/instructor/courses'),
                        },
                        {
                            key: 'course-categories',
                            label: 'Quản lý danh mục',
                            onClick: () => navigate('/instructor/course-categories'),
                        }
                    ]
                },
                {
                    key: 'lessons',
                    icon: <FileTextOutlined />,
                    label: 'Quản lý bài học',
                    onClick: () => navigate('/instructor/lessons')
                },
                {
                    key: 'course-lesson-management',
                    icon: <LinkOutlined />,
                    label: 'Liên kết Khóa học - Bài học',
                    onClick: () => navigate('/instructor/course-lesson-management')
                }
            ]
        },
        {
            key: 'enrollment-review-management-group',
            icon: <SolutionOutlined />,
            label: 'Quản lý ghi danh & đánh giá',
            children: [
                {
                    key: 'enrollments',
                    label: 'Quản lý ghi danh',
                    onClick: () => navigate('/instructor/enrollments'),
                },
                {
                    key: 'reviews',
                    label: 'Quản lý đánh giá',
                    onClick: () => navigate('/instructor/reviews'),
                }
            ]
        },
        {
            key: 'file-management',
            icon: <FolderOpenOutlined />,
            label: 'Quản lý tệp',
            onClick: () => navigate('/instructor/files')
        },
        {
            key: 'statistics',
            icon: <BarChartOutlined />,
            label: 'Thống kê',
            onClick: () => navigate('/instructor/statistics')
        },
        {
            key: 'account-management',
            icon: <UserOutlined />,
            label: 'Quản lý tài khoản',
            children: [
                {
                    key: 'my-info',
                    label: 'Xem thông tin',
                    onClick: () => navigate('/instructor/my-info'),
                },
                {
                    key: 'change-password',
                    label: 'Đổi mật khẩu',
                    onClick: () => navigate('/instructor/change-password'),
                },
                {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    onClick: handleLogout,
                    danger: true,
                }
            ]
        }
    ];

    const getSelectedKey = () => {
        const path = location.pathname.split('/')[2];

        if (path === 'courses') return 'courses';
        if (path === 'course-categories') return 'course-categories';
        if (path === 'lessons') return 'lessons';
        if (path === 'course-lesson-management') return 'course-lesson-management';
        if (path === 'enrollments') return 'enrollments';
        if (path === 'reviews') return 'reviews';
        if (path === 'statistics') return 'statistics';
        if (path === 'my-info') return 'my-info';
        if (path === 'change-password') return 'change-password';
        if (path === 'files') return 'file-management';
        
        // Fallback or default key
        return 'courses';
    };

    const getDefaultOpenKeys = () => {
        const currentPath = location.pathname;
        if (currentPath.includes('/instructor/courses') || currentPath.includes('/instructor/course-categories')) {
            return ['course-lesson-management-group', 'course-management-submenu'];
        }
        if (currentPath.includes('/instructor/lessons') || currentPath.includes('/instructor/course-lesson-management')) {
            return ['course-lesson-management-group'];
        }
        if (currentPath.includes('/instructor/enrollments') || currentPath.includes('/instructor/reviews')) {
            return ['enrollment-review-management-group'];
        }
        if (currentPath.includes('/instructor/my-info') || currentPath.includes('/instructor/change-password')) {
            return ['account-management'];
        }
        return [];
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={280} theme="light">
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
                    <img src={logo} alt="Logo" style={{ height: '40px', maxWidth: '100%' }} />
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    defaultOpenKeys={getDefaultOpenKeys()}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: 0, paddingLeft: 16 }}>
                    <h2>Trang giảng viên</h2>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default InstructorDashboard; 
import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BookOutlined,
    FileTextOutlined,
    BarChartOutlined,
    LogoutOutlined,
    AppstoreOutlined,
    LinkOutlined
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
            key: 'statistics',
            icon: <BarChartOutlined />,
            label: 'Thống kê',
            onClick: () => navigate('/instructor/statistics')
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout
        }
    ];

    const getSelectedKey = () => {
        const path = location.pathname.split('/')[2];
        if (path === 'course-categories') return 'course-categories';
        if (path === 'course-lesson-management') return 'course-lesson-management';
        return path || 'courses';
    };

    const getDefaultOpenKeys = () => {
        const currentPath = location.pathname;
        if (currentPath.includes('/instructor/courses') || currentPath.includes('/instructor/course-categories')) {
            return ['course-lesson-management-group', 'course-management-submenu'];
        }
        if (currentPath.includes('/instructor/lessons') || currentPath.includes('/instructor/course-lesson-management')) {
            return ['course-lesson-management-group'];
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
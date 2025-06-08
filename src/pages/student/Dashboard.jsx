import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BookOutlined,
    ReadOutlined,
    ShoppingCartOutlined,
    LogoutOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useContext } from 'react';
import { AuthContext } from '../../components/context/auth.context';
import logo from '../../assets/images/logo.png';

const { Header, Sider, Content } = Layout;

const StudentDashboard = () => {
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
            key: 'courses',
            icon: <BookOutlined />,
            label: 'Khóa học của tôi',
            onClick: () => navigate('/student/courses')
        },
        {
            key: 'available-courses',
            icon: <ShoppingCartOutlined />,
            label: 'Đăng ký khóa học',
            onClick: () => navigate('/student/available-courses')
        },
        {
            key: 'learning',
            icon: <ReadOutlined />,
            label: 'Học tập',
            onClick: () => navigate('/student/learning')
        },
        {
            key: 'my-account',
            icon: <UserOutlined />,
            label: 'Tài khoản của tôi',
            onClick: () => navigate('/student/my-account')
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
        if (path === 'my-account') return 'my-account';
        return path || 'courses';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider 
                width={250} 
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
                    <img src={logo} alt="Logo" style={{ height: '40px', maxWidth: '100%' }} />
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: 250 }}>
                <Header style={{ background: '#fff', padding: 0, paddingLeft: 16 }}>
                    <h2>Trang học viên</h2>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default StudentDashboard; 
import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    UserOutlined,
    BookOutlined,
    FileTextOutlined,
    BarChartOutlined,
    LogoutOutlined
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
            key: 'courses',
            icon: <BookOutlined />,
            label: 'Quản lý khóa học',
            onClick: () => navigate('/admin/courses')
        },
        {
            key: 'lessons',
            icon: <FileTextOutlined />,
            label: 'Quản lý bài học',
            onClick: () => navigate('/admin/lessons')
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
        const path = location.pathname.split('/')[2];
        return path || 'users';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="light">
                {/* Logo Section */}
                <div 
                    style={{
                        height: '64px', // Adjust height to match Header or your preference
                        margin: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0', // Optional: if you want a separator
                        // background: 'rgba(0, 0, 0, 0.02)' // Optional: slight background tint
                    }}
                >
                    {/* Use the imported siteLogo */}
                    {siteLogo ? 
                        <img src={siteLogo} alt="Logo Trang Web" style={{ height: '40px', maxWidth: '180px' /* Adjust as needed */ }} /> : 
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#001529'}}>Logo</div> // Fallback if logo fails to load
                    }
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout>
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
import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BookOutlined,
    ReadOutlined,
    ShoppingCartOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { useContext } from 'react';
import { AuthContext } from '../../components/context/auth.context';
import logo from '../../assets/images/logo.png';

const { Header, Sider, Content } = Layout;

const StudentDashboard = () => {
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
            key: 'instructors',
            icon: <TeamOutlined />,
            label: 'Danh sách giảng viên',
            onClick: () => navigate('/student/instructors')
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
        if (path === 'available-courses') return 'available-courses';
        if (path === 'instructors') return 'instructors';
        if (path === 'learning') return 'learning';
        return path || 'courses';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider 
                width={250} 
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
                        <img src={logo} alt="Logo" style={{ height: '40px', maxWidth: '100%' }} />
                    )}
                    {collapsed && (
                        <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    )}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    style={{ height: '100%', borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
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
                        <h2 style={{ margin: 0 }}>Trang học viên</h2>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default StudentDashboard; 
import React, { useContext, useState, useEffect } from 'react';
import { Button, Col, Divider, Form, Input, notification, Row, Alert, Card, Typography } from 'antd';
import { loginApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { ArrowLeftOutlined, UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { getHighestRole } from '../util/authUtils';
import logo from '../assets/images/logo.png';

const { Title } = Typography;

const LoginPage = () => {
    const navigate = useNavigate();
    const { setAuth } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loginFailCount, setLoginFailCount] = React.useState(0);
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        // Trigger the animation shortly after the component mounts
        const timer = setTimeout(() => setIsFormVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const onFinish = async (values) => {
        const { username, password } = values;
        try {
            const res = await loginApi(username, password);
            if (res && res.code === 1000 && res.result?.token) {
                localStorage.setItem("access_token", res.result.token);
                // decode token để lấy username (sub)
                const decoded = jwtDecode(res.result.token);
                
                // Role priority - chọn role có quyền cao nhất
                const userRoles = decoded.scope.split(' ');
                const highestRole = getHighestRole(userRoles);
                
                setAuth({
                    isAuthenticated: true,
                    username: decoded.sub,
                    role: highestRole,
                    scope: decoded.scope
                });
                notification.success({
                    message: "Đăng nhập thành công",
                    description: `Chào mừng ${decoded.sub} quay trở lại!`
                });
                navigate("/");
            } else {
                setLoginFailCount(prev => prev + 1);
                if (res.code === 1007) {
                    notification.error({ message: "Đăng nhập thất bại", description: "Tên đăng nhập không tồn tại." });
                } else if (res.code === 1015) {
                    notification.error({ message: "Đăng nhập thất bại", description: "Tên đăng nhập hoặc mật khẩu không đúng." });
                } else if (res.code === 1044) {
                    notification.error({ message: "Đăng nhập thất bại", description: "Bạn đã nhập sai mật khẩu nhiều lần. Vui lòng kiểm tra lại thông tin đăng nhập." });
                } else if (res.code === 1043) {
                    notification.error({ message: "Đăng nhập thất bại", description: "Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần." });
                } else {
                    notification.error({ message: "Đăng nhập thất bại", description: res?.message || "Lỗi không xác định." });
                }
            }
        } catch (err) {
            notification.error({
                message: "Lỗi hệ thống",
                description: "Đã có lỗi xảy ra, vui lòng thử lại sau."
            });
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: 400,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    borderRadius: 8,
                    opacity: isFormVisible ? 1 : 0,
                    transform: isFormVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Link to="/">
                        <img src={logo} alt="Innolearn Logo" style={{ height: '50px', marginBottom: '10px' }} />
                    </Link>
                    <Title level={3} style={{ marginBottom: 0 }}>Đăng Nhập</Title>
                </div>

                {loginFailCount >= 5 && loginFailCount < 10 && (
                    <Alert
                        type="warning"
                        message="Bạn đã nhập sai mật khẩu nhiều lần. Vui lòng kiểm tra lại thông tin đăng nhập."
                        style={{ marginBottom: 24 }}
                        showIcon
                    />
                )}
                {loginFailCount >= 10 && (
                    <Alert
                        type="error"
                        message="Tài khoản đã bị khóa"
                        description="Vui lòng liên hệ quản trị viên để được hỗ trợ."
                        style={{ marginBottom: 24 }}
                        showIcon
                    />
                )}

                <Form form={form} name="login" onFinish={onFinish} autoComplete="off" layout='vertical'>
                    <Form.Item
                        label="Tên đăng nhập"
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} icon={<LoginOutlined />} size="large" disabled={loginFailCount >= 10}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>

                <Divider>Hoặc</Divider>

                <div style={{ textAlign: "center" }}>
                    Chưa có tài khoản? <Link to={"/register"}>Đăng ký tại đây</Link>
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                </div>
            </Card>
        </div>
    );
}

export default LoginPage;
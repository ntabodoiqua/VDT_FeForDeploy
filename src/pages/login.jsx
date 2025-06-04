import React, { useContext } from 'react';
import { Button, Col, Divider, Form, Input, notification, Row, Alert } from 'antd';
import { loginApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { ArrowLeftOutlined, UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setAuth } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loginFailCount, setLoginFailCount] = React.useState(0);

    const onFinish = async (values) => {
        const { username, password } = values;
        try {
            const res = await loginApi(username, password);
            if (res && res.code === 1000 && res.result?.token) {
                localStorage.setItem("access_token", res.result.token);
                // decode token để lấy username (sub)
                const decoded = jwtDecode(res.result.token);
                // Extract role from scope
                const role = decoded.scope.split(' ')[0]; // Get first part of scope (e.g., ROLE_STUDENT)
                setAuth({
                    isAuthenticated: true,
                    username: decoded.sub,
                    role: role,
                    scope: decoded.scope
                });
                notification.success({
                    message: "LOGIN USER",
                    description: "Success"
                });
                navigate("/");
            } else {
                if (res.code === 1007) {
                    notification.error({ message: "Đăng nhập thất bại", description: "Tên đăng nhập không tồn tại." });
                } else if (res.code === 1015) {
                    setLoginFailCount(prev => prev + 1);
                    notification.error({ message: "Đăng nhập thất bại", description: "Tên đăng nhập hoặc mật khẩu không đúng." });
                } else if (res.code === 1044) {
                    setLoginFailCount(prev => prev + 1);
                    notification.error({ message: "Đăng nhập thất bại", description: "Bạn đã nhập sai mật khẩu nhiều lần. Vui lòng kiểm tra lại thông tin đăng nhập." });
                } else if (res.code === 1043) {
                    setLoginFailCount(prev => prev + 1);
                    notification.error({ message: "Đăng nhập thất bại", description: "Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần." });
                } else {
                    notification.error({ message: "Đăng nhập thất bại", description: res?.message || "Lỗi không xác định." });
                }
            }
        } catch (err) {
            notification.error({
                message: "LOGIN USER",
                description: "Login failed"
            });
        }
    };

    return (
        <Row gutter={24} style={{ marginTop: "30px" }} justify="center">
            <Col xs={24} md={16} lg={12}>
                <fieldset style={{ padding: "15px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px" }}>
                    <legend>Đăng Nhập</legend>
                    {loginFailCount >= 5 && loginFailCount < 10 && (
                        <Alert
                            type="warning"
                            message="Cảnh báo"
                            description="Bạn đã nhập sai mật khẩu nhiều lần. Vui lòng kiểm tra lại thông tin đăng nhập."
                            style={{ marginBottom: "15px" }}
                        />
                    )}
                    {loginFailCount >= 10 && (
                        <Alert
                            type="error"
                            message="Tài khoản đã bị khóa"
                            description="Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ hỗ trợ."
                            style={{ marginBottom: "15px" }}
                        />
                    )}
                    <Form form={form} name="login" onFinish={onFinish} autoComplete="off" layout='vertical'>
                        <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                            <Input prefix={<UserOutlined />} />
                        </Form.Item>
                        <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]} hasFeedback>
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ width: '100%' }} icon={<LoginOutlined />} disabled={loginFailCount >= 10}> Đăng nhập </Button>
                        </Form.Item>
                    </Form>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                    <Divider />
                    <div style={{ textAlign: "center" }}>
                        Chưa có tài khoản? <Link to={"/register"}>Đăng ký tại đây</Link>
                    </div>
                </fieldset>
            </Col>
        </Row>
    )
}

export default LoginPage;
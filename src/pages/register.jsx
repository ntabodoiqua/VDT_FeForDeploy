import React, { useState, useEffect } from 'react';
import { Button, Col, Divider, Form, Input, notification, Row, DatePicker, Select, Card, Typography } from 'antd';
import { createUserApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeftOutlined, UserOutlined, LockOutlined, IdcardOutlined, CalendarOutlined,
    MailOutlined, PhoneOutlined, FileTextOutlined, ManOutlined, WomanOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import logo from '../assets/images/logo.png';

const { Title } = Typography;

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        // Trigger the animation shortly after the component mounts
        const timer = setTimeout(() => setIsFormVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Validate họ và tên không chứa ký tự đặc biệt
    const nameValidator = (_, value) => {
        if (!value) return Promise.resolve(); // Allow empty for non-required fields
        if (/[^a-zA-ZÀ-ỹà-ỹ\s]/.test(value)) {
            return Promise.reject('Không được chứa ký tự đặc biệt hoặc số!');
        }
        return Promise.resolve();
    };

    // Validate ngày sinh >= 5 tuổi
    const dobValidator = (_, value) => {
        if (!value) return Promise.reject('Vui lòng chọn ngày sinh!');
        const now = new Date();
        const dob = value.toDate();
        const age = now.getFullYear() - dob.getFullYear() - (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate()) ? 1 : 0);
        if (age < 5) return Promise.reject('Tuổi phải từ 5 trở lên!');
        return Promise.resolve();
    };

    // Xử lý lỗi backend trả về
    const errorMap = {
        1002: 'Tên đăng nhập đã tồn tại',
        1003: 'Tên đăng nhập phải có ít nhất 3 ký tự',
        1004: 'Tên đăng nhập không được để trống',
        1005: 'Mật khẩu phải có ít nhất 8 ký tự',
        1006: 'Mật khẩu không được để trống',
        1008: 'Tuổi phải từ 5 trở lên',
        1009: 'Email không hợp lệ',
        1010: 'Số điện thoại không hợp lệ',
        1011: 'Email đã tồn tại',
        1012: 'Số điện thoại đã tồn tại',
        9999: 'Lỗi hệ thống, vui lòng thử lại sau',
    };

    const onFinish = async (values) => {
        const userData = { ...values, dob: values.dob.format('YYYY-MM-DD') };
        try {
            const res = await createUserApi(userData);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Đăng ký thành công',
                    description: 'Bạn đã đăng ký thành công. Hãy đăng nhập để bắt đầu học.'
                });
                navigate('/login');
            } else {
                notification.error({
                    message: 'Đăng ký thất bại',
                    description: errorMap[res?.code] || res?.message || 'Lỗi không xác định'
                });
            }
        } catch (err) {
            notification.error({
                message: 'Đăng ký thất bại',
                description: 'Lỗi kết nối hoặc hệ thống'
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
            padding: '40px 20px'
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: 800,
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
                    <Title level={3} style={{ marginBottom: 0 }}>Đăng Ký Tài Khoản</Title>
                </div>

                <Form form={form} name="register" onFinish={onFinish} autoComplete="off" layout="vertical">
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }, { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }]}>
                                <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }]} hasFeedback>
                                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Xác nhận mật khẩu" name="confirm" dependencies={["password"]} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject('Mật khẩu xác nhận không khớp!'); } })]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Ngày sinh" name="dob" rules={[{ required: true, validator: dobValidator }]}>
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Chọn ngày sinh" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Họ" name="lastName" rules={[{ required: true, message: 'Vui lòng nhập họ!' }, { validator: nameValidator }]}>
                                <Input prefix={<IdcardOutlined />} placeholder="Họ" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Tên" name="firstName" rules={[{ required: true, message: 'Vui lòng nhập tên!' }, { validator: nameValidator }]}>
                                <Input prefix={<IdcardOutlined />} placeholder="Tên" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }, { pattern: /^\d{9,11}$/, message: 'Số điện thoại không hợp lệ!' }]}>
                                <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                         <Col xs={24} sm={12}>
                            <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}>
                                <Select placeholder="Chọn giới tính" size="large">
                                    <Select.Option value="MALE"><ManOutlined /> Nam</Select.Option>
                                    <Select.Option value="FEMALE"><WomanOutlined /> Nữ</Select.Option>
                                    <Select.Option value="OTHER"><QuestionCircleOutlined /> Khác</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12}>
                            <Form.Item label="Tiểu sử" name="bio" rules={[{ max: 500, message: 'Tiểu sử tối đa 500 ký tự!' }]}>
                                <Input.TextArea rows={1} showCount maxLength={500} placeholder="Chia sẻ một chút về bạn..." size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} icon={<UserOutlined />} size="large">
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>

                <Divider>Hoặc</Divider>

                <div style={{ textAlign: "center" }}>
                    Đã có tài khoản? <Link to={"/login"}>Đăng nhập</Link>
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                </div>
            </Card>
        </div>
    );
}

export default RegisterPage;
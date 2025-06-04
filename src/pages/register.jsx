import React from 'react';
import { Button, Col, Divider, Form, Input, notification, Row, DatePicker, Select } from 'antd';
import { createUserApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, UserOutlined, LockOutlined, IdcardOutlined, CalendarOutlined, MailOutlined, PhoneOutlined, FileTextOutlined, ManOutlined, WomanOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // Validate họ và tên không chứa ký tự đặc biệt
    const nameValidator = (_, value) => {
        if (!value) return Promise.reject('Không được để trống!');
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
        const userData = { username: values.username, password: values.password, firstName: values.firstName, lastName: values.lastName, dob: values.dob.format('YYYY-MM-DD'), email: values.email, phone: values.phone, bio: values.bio, gender: values.gender };
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
        <Row gutter={24} style={{ marginTop: "30px" }} justify="center">
            <Col xs={24} md={16} lg={12}>
                <fieldset style={{ padding: "15px", margin: "5px", border: "1px solid #ccc", borderRadius: "5px" }}>
                    <legend>Đăng Ký Tài Khoản</legend>
                    <Form form={form} name="register" onFinish={onFinish} autoComplete="off" layout='vertical'>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }, { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }]}>
                                    <Input prefix={<UserOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }]} hasFeedback>
                                    <Input.Password prefix={<LockOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Xác nhận mật khẩu" name="confirm" dependencies={["password"]} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject('Mật khẩu xác nhận không khớp!'); } })]}>
                                    <Input.Password prefix={<LockOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Ngày sinh" name="dob" rules={[{ validator: dobValidator }]}>
                                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" suffixIcon={<CalendarOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Họ" name="lastName" rules={[{ validator: nameValidator }]}>
                                    <Input prefix={<IdcardOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Tên" name="firstName" rules={[{ validator: nameValidator }]}>
                                    <Input prefix={<IdcardOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                                    <Input prefix={<MailOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }, { pattern: /^\d{9,11}$/, message: 'Số điện thoại không hợp lệ!' }]}>
                                    <Input prefix={<PhoneOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item label="Bio" name="bio" rules={[{ required: true, message: 'Vui lòng nhập bio!' }, { max: 500, message: 'Bio tối đa 500 ký tự!' }]}>
                                    <Input.TextArea rows={3} showCount maxLength={500} prefix={<FileTextOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}>
                                    <Select suffixIcon={<QuestionCircleOutlined />}>
                                        <Select.Option value="MALE"><ManOutlined /> Nam</Select.Option>
                                        <Select.Option value="FEMALE"><WomanOutlined /> Nữ</Select.Option>
                                        <Select.Option value="OTHER"><QuestionCircleOutlined /> Khác</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" style={{ width: '100%' }} icon={<UserOutlined />}> Đăng ký </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                    <Divider />
                    <div style={{ textAlign: "center" }}> Đã có tài khoản? <Link to={"/login"}>Đăng nhập</Link> </div>
                </fieldset>
            </Col>
        </Row>
    )
}

export default RegisterPage;
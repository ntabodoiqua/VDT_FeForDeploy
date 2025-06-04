import React from 'react';
import { Button, Col, Divider, Form, Input, notification, Row, DatePicker, Select } from 'antd';
import { createUserApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

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
        const userData = {
            username: values.username,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            dob: values.dob.format('YYYY-MM-DD'),
            email: values.email,
            phone: values.phone,
            bio: values.bio,
            gender: values.gender
        };s
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
        <Row justify={"center"} style={{ marginTop: "30px" }}>
            <Col xs={24} md={16} lg={8}>
                <fieldset style={{
                    padding: "15px",
                    margin: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "5px"
                }}>
                    <legend>Đăng Ký Tài Khoản</legend>
                    <Form
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout='vertical'
                    >
                        <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }, { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }]} hasFeedback>
                            <Input.Password />
                        </Form.Item>
                        <Form.Item label="Xác nhận mật khẩu" name="confirm" dependencies={["password"]} hasFeedback rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject('Mật khẩu xác nhận không khớp!');
                                },
                            }),
                        ]}>
                            <Input.Password />
                        </Form.Item>
                        <Form.Item label="Họ" name="lastName" rules={[{ validator: nameValidator }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Tên" name="firstName" rules={[{ validator: nameValidator }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Ngày sinh" name="dob" rules={[{ validator: dobValidator }]}>
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }, { pattern: /^\d{9,11}$/, message: 'Số điện thoại không hợp lệ!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Bio" name="bio" rules={[{ required: true, message: 'Vui lòng nhập bio!' }, { max: 500, message: 'Bio tối đa 500 ký tự!' }]}>
                            <Input.TextArea rows={3} showCount maxLength={500} />
                        </Form.Item>
                        <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}> 
                            <Select>
                                <Select.Option value="MALE">Nam</Select.Option>
                                <Select.Option value="FEMALE">Nữ</Select.Option>
                                <Select.Option value="OTHER">Khác</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                                Đăng ký
                            </Button>
                        </Form.Item>
                    </Form>
                    <Link to={"/"}><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                    <Divider />
                    <div style={{ textAlign: "center" }}>
                        Đã có tài khoản? <Link to={"/login"}>Đăng nhập</Link>
                    </div>
                </fieldset>
            </Col>
        </Row>
    )
}

export default RegisterPage;
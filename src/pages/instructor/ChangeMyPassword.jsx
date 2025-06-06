import React, { useState } from 'react';
import { Form, Input, Button, notification, Typography, Card, Row, Col } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { changeMyPasswordApi } from '../../util/api';

const { Title, Text } = Typography;

const ChangeMyPassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await changeMyPasswordApi({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });

            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Đổi mật khẩu thành công!',
                });
                form.resetFields();
            } else {
                // Handle specific API errors
                let errorMessage = 'Đã có lỗi xảy ra.';
                if (res.code === 1017) {
                    errorMessage = 'Mật khẩu cũ không đúng.';
                } else if (res.code === 1018) {
                    errorMessage = 'Mật khẩu mới phải khác mật khẩu cũ.';
                } else if (res.message) {
                    errorMessage = res.message;
                }
                notification.error({
                    message: 'Lỗi',
                    description: errorMessage,
                });
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã có lỗi xảy ra trong quá trình đổi mật khẩu.',
            });
            console.error('Failed to change password:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row justify="center" style={{ marginTop: '20px' }}>
            <Col xs={24} sm={20} md={16} lg={12} xl={8}>
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LockOutlined />
                            <Title level={4} style={{ marginBottom: 0 }}>
                                Đổi mật khẩu
                            </Title>
                        </div>
                    }
                    bordered={false}
                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                >
                    <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
                        Để tăng cường bảo mật, hãy chọn một mật khẩu mạnh và không sử dụng lại cho các tài khoản khác.
                    </Text>
                    <Form
                        form={form}
                        name="change_password"
                        onFinish={onFinish}
                        layout="vertical"
                    >
                        <Form.Item
                            name="oldPassword"
                            label="Mật khẩu cũ"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu hiện tại của bạn" />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                        >
                            <Input.Password placeholder="Tạo mật khẩu mới" />
                        </Form.Item>

                        <Form.Item
                            name="confirmNewPassword"
                            label="Xác nhận mật khẩu mới"
                            dependencies={['newPassword']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Nhập lại mật khẩu mới để xác nhận" />
                        </Form.Item>

                        <Form.Item style={{ marginTop: '24px' }}>
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                Cập nhật mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default ChangeMyPassword; 
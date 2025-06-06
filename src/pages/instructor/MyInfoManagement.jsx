import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Spin, Alert, Tag, Avatar, Typography, Button, Modal, Form, Input, DatePicker, notification, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { fetchMyInfoApi, updateMyInfoApi, updateAvatarApi } from '../../util/api';
import moment from 'moment';

const { Title } = Typography;

const MyInfoManagement = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            const res = await fetchMyInfoApi();
            if (res && res.result) {
                setUserInfo(res.result);
                form.setFieldsValue({
                    ...res.result,
                    dob: res.result.dob ? moment(res.result.dob) : null,
                });
            } else {
                setError('Không thể tải thông tin người dùng.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi tải thông tin.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleFormSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                dob: values.dob ? moment(values.dob).format('YYYY-MM-DD') : null,
            };
            const res = await updateMyInfoApi(payload);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Thông tin cá nhân đã được cập nhật.',
                });
                setIsModalVisible(false);
                fetchUserInfo(); // Refresh user info
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: res.message || 'Không thể cập nhật thông tin.',
                });
            }
        } catch (err) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi cập nhật thông tin.',
            });
            console.error(err);
        }
    };

    const handleAvatarUpload = async (options) => {
        const { file, onSuccess, onError } = options;
        try {
            const res = await updateAvatarApi(file);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Ảnh đại diện đã được cập nhật.',
                });
                fetchUserInfo(); // Refresh user info to get new avatar URL
                onSuccess(res);
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: res.message || 'Không thể cập nhật ảnh đại diện.',
                });
                onError(new Error(res.message));
            }
        } catch (err) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi tải lên ảnh đại diện.',
            });
            console.error(err);
            onError(err);
        }
    };

    if (loading) {
        return <Spin tip="Đang tải..." style={{ display: 'block', textAlign: 'center', marginTop: '50px' }} />;
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    if (!userInfo) {
        return <Alert message="Thông báo" description="Không tìm thấy thông tin người dùng." type="info" showIcon />;
    }

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/lms')
            ? import.meta.env.VITE_BACKEND_URL.replace('/lms', '')
            : import.meta.env.VITE_BACKEND_URL;
        return `${baseUrl}/lms${path}`;
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3}>Thông tin cá nhân</Title>
                <Button type="primary" onClick={showModal}>Chỉnh sửa</Button>
            </div>
            <Card>
                <Descriptions bordered column={1} labelStyle={{ width: '200px' }}>
                    <Descriptions.Item label="Avatar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Avatar src={getAvatarUrl(userInfo.avatarUrl)} size={64} />
                            <Upload
                                customRequest={handleAvatarUpload}
                                showUploadList={false}
                                maxCount={1}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Tải lên ảnh mới</Button>
                            </Upload>
                        </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="ID">{userInfo.id}</Descriptions.Item>
                    <Descriptions.Item label="Tên đăng nhập">{userInfo.username}</Descriptions.Item>
                    <Descriptions.Item label="Họ và tên">{`${userInfo.lastName} ${userInfo.firstName}`}</Descriptions.Item>
                    <Descriptions.Item label="Email">{userInfo.email}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{userInfo.phone}</Descriptions.Item>
                    <Descriptions.Item label="Tiểu sử">{userInfo.bio}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">{moment(userInfo.dob).format('DD/MM/YYYY')}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{userInfo.gender}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{moment(userInfo.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                    <Descriptions.Item label="Vai trò">
                        {userInfo.roles.map(role => (
                            <Tag key={role.name} color="blue">{role.name}</Tag>
                        ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {userInfo.enabled ? <Tag color="success">Kích hoạt</Tag> : <Tag color="error">Vô hiệu hóa</Tag>}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Modal
                title="Chỉnh sửa thông tin cá nhân"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => form.submit()}>
                        Lưu
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Form.Item name="firstName" label="Họ" rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="dob" label="Ngày sinh">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại">
                        <Input />
                    </Form.Item>
                    <Form.Item name="bio" label="Tiểu sử">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default MyInfoManagement; 
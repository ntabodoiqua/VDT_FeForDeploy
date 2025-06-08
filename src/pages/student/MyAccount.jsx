import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Descriptions, 
    Spin, 
    Alert, 
    Tag, 
    Avatar, 
    Typography, 
    Button, 
    Modal, 
    Form, 
    Input, 
    DatePicker, 
    notification, 
    Upload, 
    List, 
    Image,
    Row,
    Col,
    Divider
} from 'antd';
import { UploadOutlined, EditOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { 
    fetchMyInfoApi, 
    updateMyInfoApi, 
    updateAvatarApi, 
    fetchAllImagesOfUserApi, 
    setAvatarFromUploadedFileApi,
    changeMyPasswordApi 
} from '../../util/api';
import moment from 'moment';

const { Title, Text } = Typography;

const MyAccount = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [userImages, setUserImages] = useState([]);
    const [imagesLoading, setImagesLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/lms')
            ? import.meta.env.VITE_BACKEND_URL.replace('/lms', '')
            : import.meta.env.VITE_BACKEND_URL;
        return `${baseUrl}/lms${path}`;
    };

    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            const res = await fetchMyInfoApi();
            if (res && res.result) {
                setUserInfo(res.result);
                editForm.setFieldsValue({
                    ...res.result,
                    dob: res.result.dob ? moment(res.result.dob) : null,
                });
            } else {
                setError('Không thể tải thông tin tài khoản.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi tải thông tin tài khoản.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    // Edit info modal handlers
    const showEditModal = () => {
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        editForm.resetFields();
    };

    const handleEditSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                dob: values.dob ? moment(values.dob).format('YYYY-MM-DD') : null,
            };
            const res = await updateMyInfoApi(payload);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Thông tin tài khoản đã được cập nhật.',
                });
                setIsEditModalVisible(false);
                fetchUserInfo();
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

    // Password change modal handlers
    const showPasswordModal = () => {
        setIsPasswordModalVisible(true);
    };

    const handlePasswordCancel = () => {
        setIsPasswordModalVisible(false);
        passwordForm.resetFields();
    };

    const handlePasswordSubmit = async (values) => {
        try {
            const res = await changeMyPasswordApi(values);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Mật khẩu đã được thay đổi.',
                });
                setIsPasswordModalVisible(false);
                passwordForm.resetFields();
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: res.message || 'Không thể thay đổi mật khẩu.',
                });
            }
        } catch (err) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi thay đổi mật khẩu.',
            });
            console.error(err);
        }
    };

    // Avatar upload handler
    const handleAvatarUpload = async (options) => {
        const { file, onSuccess, onError } = options;
        try {
            const res = await updateAvatarApi(file);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Ảnh đại diện đã được cập nhật.',
                });
                fetchUserInfo();
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

    // Image selection modal handlers
    const showImageModal = async () => {
        setIsImageModalVisible(true);
        setImagesLoading(true);
        try {
            const res = await fetchAllImagesOfUserApi();
            if (res && res.result) {
                setUserImages(res.result);
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: 'Không thể tải danh sách ảnh.'
                });
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi tải danh sách ảnh.'
            });
        } finally {
            setImagesLoading(false);
        }
    };

    const handleImageModalCancel = () => {
        setIsImageModalVisible(false);
        setSelectedImage(null);
    };

    const handleSetAvatarFromFile = async () => {
        if (!selectedImage) {
            notification.warn({
                message: 'Cảnh báo',
                description: 'Vui lòng chọn một ảnh.'
            });
            return;
        }
        try {
            const fileName = selectedImage.split('/').pop();
            const res = await setAvatarFromUploadedFileApi(fileName);
            if (res && res.code === 1000) {
                notification.success({
                    message: 'Thành công',
                    description: 'Ảnh đại diện đã được cập nhật.',
                });
                handleImageModalCancel();
                fetchUserInfo();
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: res.message || 'Không thể cập nhật ảnh đại diện.',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: 'Đã xảy ra lỗi khi cập nhật ảnh đại diện.',
            });
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Đang tải thông tin tài khoản...</p>
            </div>
        );
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    if (!userInfo) {
        return <Alert message="Thông báo" description="Không tìm thấy thông tin tài khoản." type="info" showIcon />;
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Tài khoản của tôi
                </Title>
                <Text type="secondary">Quản lý thông tin cá nhân và bảo mật tài khoản.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card 
                        title="Thông tin cá nhân" 
                        extra={
                            <Button type="primary" icon={<EditOutlined />} onClick={showEditModal}>
                                Chỉnh sửa
                            </Button>
                        }
                    >
                        <Descriptions bordered column={1} labelStyle={{ width: '180px' }}>
                            <Descriptions.Item label="Tên đăng nhập">
                                {userInfo.username}
                            </Descriptions.Item>
                            <Descriptions.Item label="Họ và tên">
                                {`${userInfo.lastName} ${userInfo.firstName}`}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {userInfo.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {userInfo.phone || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh">
                                {userInfo.dob ? moment(userInfo.dob).format('DD/MM/YYYY') : 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giới tính">
                                {userInfo.gender || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiểu sử">
                                {userInfo.bio || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo tài khoản">
                                {moment(userInfo.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {userInfo.enabled ? 
                                    <Tag color="success">Đang hoạt động</Tag> : 
                                    <Tag color="error">Đã vô hiệu hóa</Tag>
                                }
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                
                <Col xs={24} lg={8}>
                    <Card title="Ảnh đại diện">
                        <div style={{ textAlign: 'center' }}>
                            <Avatar 
                                src={getAvatarUrl(userInfo.avatarUrl)} 
                                size={120} 
                                style={{ marginBottom: 16 }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Upload
                                    customRequest={handleAvatarUpload}
                                    showUploadList={false}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />} block>
                                        Tải lên ảnh mới
                                    </Button>
                                </Upload>
                                <Button onClick={showImageModal} block>
                                    Chọn từ ảnh đã tải lên
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card title="Bảo mật" style={{ marginTop: 16 }}>
                        <Button 
                            type="primary" 
                            icon={<LockOutlined />} 
                            onClick={showPasswordModal}
                            block
                        >
                            Đổi mật khẩu
                        </Button>
                    </Card>
                </Col>
            </Row>

            {/* Edit Info Modal */}
            <Modal
                title="Chỉnh sửa thông tin cá nhân"
                visible={isEditModalVisible}
                onCancel={handleEditCancel}
                footer={[
                    <Button key="back" onClick={handleEditCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => editForm.submit()}>
                        Lưu thay đổi
                    </Button>,
                ]}
                width={600}
            >
                <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                name="firstName" 
                                label="Tên" 
                                rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                name="lastName" 
                                label="Họ" 
                                rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item 
                        name="email" 
                        label="Email" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại">
                        <Input />
                    </Form.Item>
                    <Form.Item name="dob" label="Ngày sinh">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="bio" label="Tiểu sử">
                        <Input.TextArea rows={4} placeholder="Viết vài dòng về bản thân..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title="Đổi mật khẩu"
                visible={isPasswordModalVisible}
                onCancel={handlePasswordCancel}
                footer={[
                    <Button key="back" onClick={handlePasswordCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => passwordForm.submit()}>
                        Đổi mật khẩu
                    </Button>,
                ]}
                width={500}
            >
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
                    <Form.Item 
                        name="oldPassword" 
                        label="Mật khẩu hiện tại"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item 
                        name="newPassword" 
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item 
                        name="confirmPassword" 
                        label="Xác nhận mật khẩu mới"
                        dependencies={['newPassword']}
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
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Image Selection Modal */}
            <Modal
                title="Chọn ảnh đại diện"
                visible={isImageModalVisible}
                onCancel={handleImageModalCancel}
                onOk={handleSetAvatarFromFile}
                okText="Đặt làm ảnh đại diện"
                cancelText="Hủy"
                width={800}
                okButtonProps={{ disabled: !selectedImage }}
            >
                <Spin spinning={imagesLoading}>
                    {userImages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Text type="secondary">Bạn chưa có ảnh nào được tải lên</Text>
                        </div>
                    ) : (
                        <List
                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }}
                            dataSource={userImages}
                            renderItem={item => (
                                <List.Item
                                    onClick={() => setSelectedImage(item)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '8px',
                                        border: selectedImage === item ? '2px solid #1890ff' : '2px solid transparent',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <Image
                                        width="100%"
                                        src={getAvatarUrl(item)}
                                        preview={false}
                                        style={{ objectFit: 'cover', height: '120px', borderRadius: '4px' }}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default MyAccount; 
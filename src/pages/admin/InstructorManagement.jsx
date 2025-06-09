import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Spin, Tag, Input, Select, Card, Row, Col, Avatar, Tooltip, Switch, Descriptions, Rate, List, Typography, Form, DatePicker } from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, StopOutlined, UserOutlined, BookOutlined, StarOutlined, TrophyOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
    fetchAllInstructorsApi, 
    updateUserStatusApi,
    updateUserDetailsApi,
    fetchInstructorByIdApi,
    fetchInstructorCoursesApi 
} from '../../util/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const InstructorManagement = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '15', '20'],
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`
    });

    // Filter states
    const [filterUsername, setFilterUsername] = useState('');
    const [filterFirstName, setFilterFirstName] = useState('');
    const [filterLastName, setFilterLastName] = useState('');
    const [filterEnabled, setFilterEnabled] = useState(null);

    const [appliedFilters, setAppliedFilters] = useState({});
    const [currentSorter, setCurrentSorter] = useState({ field: 'username', order: 'ascend' });

    // States for instructor preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewInstructor, setPreviewInstructor] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [instructorCourses, setInstructorCourses] = useState([]);

    // States for Edit Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm] = Form.useForm();

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null;
        if (urlPath.startsWith('http')) return urlPath;
        return `http://localhost:8080/lms${urlPath}`;
    };

    const handleApplyFilters = () => {
        const newFilters = {
            username: filterUsername,
            firstName: filterFirstName,
            lastName: filterLastName,
            enabled: filterEnabled,
        };
        setAppliedFilters(newFilters);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleResetFilters = () => {
        setFilterUsername('');
        setFilterFirstName('');
        setFilterLastName('');
        setFilterEnabled(null);
        setAppliedFilters({});
        setPagination(prev => ({ ...prev, current: 1 }));
        setCurrentSorter({ field: 'username', order: 'ascend' });
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
            };

            const nameParts = [];
            if (appliedFilters.firstName) nameParts.push(appliedFilters.firstName);
            if (appliedFilters.lastName) nameParts.push(appliedFilters.lastName);
            const fullName = nameParts.join(' ').trim();

            if (appliedFilters.username) {
                params.name = appliedFilters.username;
            } else if (fullName) {
                params.name = fullName;
            }

            if (typeof appliedFilters.enabled === 'boolean') {
                params.enabled = appliedFilters.enabled;
            }
            
            if (currentSorter && currentSorter.field && currentSorter.order) {
                params.sort = `${currentSorter.field},${currentSorter.order === 'ascend' ? 'asc' : 'desc'}`;
            } else {
                params.sort = 'username,asc';
            }

            const response = await fetchAllInstructorsApi(params);
            if (response && response.code === 1000) {
                setInstructors(response.result.content || []);
                setPagination(prev => ({
                    ...prev,
                    current: (response.result.number || 0) + 1,
                    pageSize: response.result.size || pagination.pageSize,
                    total: response.result.totalElements || 0,
                }));
            } else {
                message.error('Không thể tải danh sách giảng viên.');
            }
        } catch (error) {
            console.error("Fetch instructors error:", error);
            message.error('Có lỗi xảy ra khi tải danh sách giảng viên.');
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, appliedFilters, currentSorter]);

    const fetchInstructorPreview = async (instructorId) => {
        setLoadingPreview(true);
        setPreviewModalVisible(true);
        try {
            const instructorResponse = await fetchInstructorByIdApi(instructorId);
            if (instructorResponse && instructorResponse.code === 1000) {
                setPreviewInstructor(instructorResponse.result);
                
                const coursesResponse = await fetchInstructorCoursesApi(instructorId, { page: 0, size: 10, sort: 'createdAt,desc' });
                if (coursesResponse && coursesResponse.code === 1000) {
                    setInstructorCourses(coursesResponse.result.content || []);
                }
            } else {
                message.error('Không thể tải thông tin chi tiết giảng viên.');
                setPreviewModalVisible(false);
            }
        } catch (error) {
            console.error('Error fetching instructor preview:', error);
            message.error('Lỗi khi tải chi tiết giảng viên.');
            setPreviewModalVisible(false);
        } finally {
            setLoadingPreview(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (newPagination, filters, sorter) => {
        setPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }));
        if (sorter && sorter.field && sorter.order) {
            setCurrentSorter({ field: sorter.field, order: sorter.order });
        } else {
            setCurrentSorter({ field: 'username', order: 'ascend' });
        }
    };

    const handleToggleStatus = async (userRecord, newStatus) => {
        const isAdmin = userRecord.roles?.some(role => role.name === 'ADMIN');
        const action = newStatus ? 'enable' : 'disable';

        if (isAdmin && action === 'disable') {
            message.error('Không thể vô hiệu hóa giảng viên có quyền Quản trị viên.');
            return;
        }

        try {
            const response = await updateUserStatusApi(userRecord.id, action);
            if (response && response.code === 1000) {
                message.success(`Cập nhật trạng thái giảng viên thành công!`);
                fetchData();
            } else {
                message.error(response.message || 'Không thể cập nhật trạng thái.');
            }
        } catch (error) {
            console.error("Toggle instructor status error:", error);
            message.error('Có lỗi xảy ra khi cập nhật trạng thái.');
        }
    };

    // --- Edit Modal Functions ---
    const showEditModal = (user) => {
        setEditingUser(user);
        editForm.setFieldsValue({
            firstName: user.firstName,
            lastName: user.lastName,
            dob: user.dob ? dayjs(user.dob) : null,
            roles: user.roles.map(role => role.name),
            email: user.email,
            phone: user.phone,
            gender: user.gender,
        });
        setEditModalVisible(true);
    };

    const handleCancelEditModal = () => {
        setEditModalVisible(false);
        setEditingUser(null);
        editForm.resetFields();
    };

    const handleUpdateUser = async (values) => {
        if (!editingUser) return;

        const payload = {
            ...values,
            dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        };

        try {
            const response = await updateUserDetailsApi(editingUser.id, payload);
            if (response.code === 1000) {
                message.success('Cập nhật người dùng thành công!');
                handleCancelEditModal();
                fetchData();
            } else {
                message.error(`Cập nhật người dùng thất bại: ${response.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            console.error('Lỗi cập nhật người dùng:', error);
            message.error(`Cập nhật người dùng thất bại: ${error.response?.data?.message || error.message}`);
        }
    };
    // --- End Edit Modal Functions ---

    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
            sorter: true,
        },
        {
            title: 'Giảng viên',
            key: 'name',
            render: (_, record) => (
                <Space>
                    <Avatar src={getDisplayImageUrl(record.avatarUrl)} icon={<UserOutlined />} />
                    <span>{`${record.firstName || ''} ${record.lastName || ''}`.trim()}</span>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Khóa học',
            dataIndex: 'totalCourses',
            key: 'totalCourses',
            align: 'center',
            render: (text) => text || 0,
        },
        {
            title: 'Học viên',
            dataIndex: 'totalStudents',
            key: 'totalStudents',
            align: 'center',
            render: (text) => text || 0,
        },
        {
            title: 'Đánh giá',
            dataIndex: 'averageRating',
            key: 'averageRating',
            align: 'center',
            render: (rating, record) => (
                <Space>
                    <StarOutlined style={{ color: '#fadb14' }}/>
                    <span>{`${(rating || 0).toFixed(1)} (${record.totalReviews || 0})`}</span>
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'enabled',
            key: 'enabled',
            align: 'center',
            render: (enabled, record) => (
                 <Tooltip title={enabled ? 'Hoạt động' : 'Vô hiệu hóa'}>
                    <Switch
                        checked={enabled}
                        onChange={(checked) => handleToggleStatus(record, checked)}
                        checkedChildren={<CheckCircleOutlined />}
                        unCheckedChildren={<StopOutlined />}
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button icon={<EyeOutlined />} onClick={() => fetchInstructorPreview(record.id)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Quản lý Giảng viên</Title>
                <Row gutter={16} style={{ marginTop: 16, flexWrap: 'wrap', gap: '8px 0' }}>
                    <Col>
                        <Input
                            placeholder="Tìm theo Tên đăng nhập"
                            value={filterUsername}
                            onChange={(e) => setFilterUsername(e.target.value)}
                            style={{ width: 200 }}
                        />
                    </Col>
                    <Col>
                        <Input
                            placeholder="Tìm theo Tên"
                            value={filterFirstName}
                            onChange={(e) => setFilterFirstName(e.target.value)}
                             style={{ width: 200 }}
                        />
                    </Col>
                    <Col>
                        <Input
                            placeholder="Tìm theo Họ"
                            value={filterLastName}
                            onChange={(e) => setFilterLastName(e.target.value)}
                             style={{ width: 200 }}
                        />
                    </Col>
                    <Col>
                        <Select
                            placeholder="Lọc theo trạng thái"
                            value={filterEnabled}
                            onChange={(value) => setFilterEnabled(value)}
                            style={{ width: 200 }}
                            allowClear
                        >
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Vô hiệu hóa</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleApplyFilters}>
                                Áp dụng
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={instructors}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title="Thông tin chi tiết giảng viên"
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={[<Button key="close" onClick={() => setPreviewModalVisible(false)}>Đóng</Button>]}
                width={800}
            >
                {loadingPreview ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                ) : previewInstructor ? (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Họ và tên" span={2}>
                            <Space>
                                <Avatar src={getDisplayImageUrl(previewInstructor.avatarUrl)} icon={<UserOutlined />} />
                                {`${previewInstructor.lastName} ${previewInstructor.firstName}`}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">{previewInstructor.email}</Descriptions.Item>
                        <Descriptions.Item label="Tên đăng nhập">{previewInstructor.username}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò" span={2}>
                            {previewInstructor.roles?.map(role => (
                                <Tag 
                                    key={role.name}
                                    color={
                                        role.name === 'ADMIN' ? 'red' :
                                        role.name === 'INSTRUCTOR' ? 'blue' :
                                        'green'
                                    }
                                >
                                    {role.name}
                                </Tag>
                            ))}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kinh nghiệm">{previewInstructor.experienceYears || 0} năm</Descriptions.Item>
                        <Descriptions.Item label="Tiểu sử" span={2}>{previewInstructor.bio}</Descriptions.Item>
                        <Descriptions.Item label="Khóa học"><BookOutlined /> {previewInstructor.totalCourses || 0}</Descriptions.Item>
                        <Descriptions.Item label="Học viên"><UserOutlined /> {previewInstructor.totalStudents || 0}</Descriptions.Item>
                        <Descriptions.Item label="Đánh giá" span={2}>
                            <Rate disabled defaultValue={previewInstructor.averageRating || 0} />
                            <span style={{ marginLeft: 8 }}>({(previewInstructor.averageRating || 0).toFixed(1)}/5 từ {previewInstructor.totalReviews} lượt)</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thành tích" span={2}>
                            {previewInstructor.achievements?.length > 0 
                                ? previewInstructor.achievements.map((ach, i) => <Tag color="gold" key={i}><TrophyOutlined /> {ach}</Tag>)
                                : 'Chưa có'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Các khóa học" span={2}>
                            <List
                                size="small"
                                dataSource={instructorCourses}
                                renderItem={course => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar src={getDisplayImageUrl(course.thumbnailUrl)} shape="square" />}
                                            title={course.title}
                                            description={`${(course.price || 0).toLocaleString('vi-VN')} VNĐ`}
                                        />
                                    </List.Item>
                                )}
                            />
                        </Descriptions.Item>
                    </Descriptions>
                ) : null}
            </Modal>

            {editingUser && (
                <Modal
                    title={`Chỉnh sửa Giảng viên: ${editingUser.username}`}
                    open={editModalVisible}
                    onCancel={handleCancelEditModal}
                    onOk={() => editForm.submit()}
                    confirmLoading={loading}
                    width={600}
                >
                    <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
                        <Form.Item
                            name="firstName"
                            label="Tên"
                            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="lastName"
                            label="Họ"
                            rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="phone" label="Điện thoại">
                            <Input />
                        </Form.Item>
                        <Form.Item name="gender" label="Giới tính">
                            <Select placeholder="Chọn giới tính" allowClear>
                                <Option value="MALE">Nam</Option>
                                <Option value="FEMALE">Nữ</Option>
                                <Option value="OTHER">Khác</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="dob" label="Ngày sinh">
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item
                            name="roles"
                            label="Vai trò"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò!' }]}
                        >
                            <Select mode="multiple" allowClear placeholder="Chọn vai trò">
                                <Option value="ADMIN">Quản trị viên</Option>
                                <Option value="INSTRUCTOR">Giảng viên</Option>
                                <Option value="STUDENT">Học viên</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default InstructorManagement; 
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Space, Button, Input, Select, Tag, Switch, message, Modal, Tooltip, DatePicker, Form, Card, Row, Col, Statistic, Typography } from 'antd';
import { SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, LockOutlined, UnlockOutlined, EditOutlined, DeleteOutlined, KeyOutlined, BarChartOutlined } from '@ant-design/icons';
import {
    fetchUsersApi,
    updateUserStatusApi,
    updateUserDetailsApi,
    changeUserPasswordApi,
    deleteUserApi,
    fetchUserStatisticsApi
} from '../../util/api';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { Column, Pie, Line } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Title } = Typography;

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '15', '20'],
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterUsername, setFilterUsername] = useState('');
    const [filterFirstName, setFilterFirstName] = useState('');
    const [filterLastName, setFilterLastName] = useState('');
    const [filterEnabled, setFilterEnabled] = useState(null);
    const [filterGender, setFilterGender] = useState(null);
    const [filterCreatedFrom, setFilterCreatedFrom] = useState(null);
    const [filterCreatedTo, setFilterCreatedTo] = useState(null);
    const [filterRoles, setFilterRoles] = useState(null);
    const [currentSorter, setCurrentSorter] = useState({ field: 'username', order: 'ascend' });

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm] = Form.useForm();

    const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
    const [userForPasswordChange, setUserForPasswordChange] = useState(null);
    const [changePasswordForm] = Form.useForm();

    // State for statistics
    const [statsModalVisible, setStatsModalVisible] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [newUserStats, setNewUserStats] = useState([]);
    const [roleDistributionStats, setRoleDistributionStats] = useState([]);
    const [statusDistributionStats, setStatusDistributionStats] = useState([]);
    const [totalUserCount, setTotalUserCount] = useState(0);

    const [permissionError, setPermissionError] = useState(false);

    const handleApiPermissionError = (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            setPermissionError(true);
            return true;
        }
        return false;
    };

    const handleFilterChange = (value, setter) => {
        setter(value);
    };

    const handleResetFilters = () => {
        setFilterUsername('');
        setFilterFirstName('');
        setFilterLastName('');
        setFilterEnabled(null);
        setFilterGender(null);
        setFilterCreatedFrom(null);
        setFilterCreatedTo(null);
        setFilterRoles(null);
        setPagination(prev => ({ ...prev, current: 1 }));
        setCurrentSorter({ field: 'username', order: 'ascend' });
    };

    const fetchData = useCallback(async () => {
        const params = {
            page: pagination.current - 1,
            size: pagination.pageSize
        };

        if (filterUsername && filterUsername.trim() !== '') params.username = filterUsername.trim();
        if (filterFirstName && filterFirstName.trim() !== '') params.firstName = filterFirstName.trim();
        if (filterLastName && filterLastName.trim() !== '') params.lastName = filterLastName.trim();
        if (typeof filterEnabled === 'boolean') params.enabled = filterEnabled;
        if (filterGender) params.gender = filterGender;
        if (filterCreatedFrom) {
            const fromDate = new Date(filterCreatedFrom.format('YYYY-MM-DD'));
            fromDate.setHours(0, 0, 0, 0);
            params.createdFrom = fromDate.toISOString();
        }
        if (filterCreatedTo) {
            const toDate = new Date(filterCreatedTo.format('YYYY-MM-DD'));
            toDate.setHours(23, 59, 59, 999);
            params.createdTo = toDate.toISOString();
        }
        if (filterRoles) params.roles = filterRoles;

        if (currentSorter && currentSorter.field && currentSorter.order) {
            params.sort = `${currentSorter.field},${currentSorter.order === 'ascend' ? 'asc' : 'desc'}`;
        } else {
            params.sort = 'username,asc';
        }

        const queryParams = new URLSearchParams(params);
        const url = `/lms/admin/manage-users?${queryParams.toString()}`;
        console.log('Yêu cầu URL:', url);

        try {
            setLoading(true);
            const response = await fetchUsersApi(params);
            console.log('Phản hồi API:', response);

            if (response.code === 1000) {
                const { content, totalElements, number } = response.result;
                setUsers(content);
                setPagination(prev => ({
                    ...prev,
                    current: number + 1,
                    total: totalElements
                }));
            } else {
                console.error('Mã lỗi API:', response.code);
                message.error(`Lấy danh sách người dùng thất bại: ${response.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            if (!handleApiPermissionError(error)) {
                console.error('Chi tiết lỗi:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    headers: error.response?.headers
                });
                message.error(`Lấy danh sách người dùng thất bại: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [
        pagination.current, pagination.pageSize, currentSorter,
        filterUsername, filterFirstName, filterLastName, filterEnabled,
        filterGender, filterCreatedFrom, filterCreatedTo, filterRoles
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (newPagination, filters, sorter) => {
        console.log('Thay đổi bảng:', newPagination, filters, sorter);
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

    const handleStatusChange = async (userId, enabled) => {
        try {
            setLoading(true);
            const action = enabled ? 'enable' : 'disable';
            const response = await updateUserStatusApi(userId, action);

            if (response.code === 1000) {
                message.success(response.result || `Người dùng đã được ${enabled ? 'kích hoạt' : 'vô hiệu hóa'} thành công`);
                fetchData();
            } else {
                message.error(`Thay đổi trạng thái người dùng thất bại: ${response.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            if (!handleApiPermissionError(error)) {
                console.error(`Lỗi ${enabled ? 'kích hoạt' : 'vô hiệu hóa'} người dùng:`, error);
                const actionText = enabled ? 'kích hoạt' : 'vô hiệu hóa';
                message.error(`Thay đổi trạng thái người dùng thất bại: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const showUserDetails = (user) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

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
            firstName: values.firstName,
            lastName: values.lastName,
            dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
            roles: values.roles,
            email: values.email,
            phone: values.phone,
            gender: values.gender,
        };

        console.log('Cập nhật người dùng:', editingUser.id, 'với payload:', payload);

        try {
            setLoading(true);
            const response = await updateUserDetailsApi(editingUser.id, payload);
            if (response.code === 1000) {
                message.success('Cập nhật người dùng thành công!');
                setEditModalVisible(false);
                setEditingUser(null);
                editForm.resetFields();
                fetchData();
            } else {
                message.error(`Cập nhật người dùng thất bại: ${response.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            if (!handleApiPermissionError(error)) {
                console.error('Lỗi cập nhật người dùng:', error);
                message.error(`Cập nhật người dùng thất bại: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const showChangePasswordModal = (user) => {
        setUserForPasswordChange(user);
        changePasswordForm.resetFields();
        setChangePasswordModalVisible(true);
    };

    const handleCancelChangePasswordModal = () => {
        setChangePasswordModalVisible(false);
        setUserForPasswordChange(null);
        changePasswordForm.resetFields();
    };

    const handleChangePassword = async (values) => {
        if (!userForPasswordChange) return;

        const payload = { newPassword: values.newPassword };
        console.log('Thay đổi mật khẩu cho người dùng:', userForPasswordChange.id);

        try {
            setLoading(true);
            const response = await changeUserPasswordApi(userForPasswordChange.id, payload);
            if (response.code === 1000) {
                message.success(response.result || 'Thay đổi mật khẩu thành công!');
                handleCancelChangePasswordModal();
            } else {
                message.error(`Thay đổi mật khẩu thất bại: ${response.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            if (!handleApiPermissionError(error)) {
                console.error('Lỗi thay đổi mật khẩu:', error);
                message.error(`Thay đổi mật khẩu thất bại: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (userId, username) => {
        Modal.confirm({
            title: `Xác nhận Xóa Người dùng`,
            content: `Bạn có chắc chắn muốn xóa người dùng "${username}"? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setLoading(true);
                    const response = await deleteUserApi(userId);
                    if (response.code === 1000) {
                        message.success(response.result || `Người dùng "${username}" đã được xóa thành công.`);
                        fetchData();
                    } else {
                        message.error(`Xóa người dùng "${username}" thất bại: ${response.message || 'Lỗi không xác định'}`);
                    }
                } catch (error) {
                    if (!handleApiPermissionError(error)) {
                        console.error('Lỗi xóa người dùng:', error);
                        message.error(`Xóa người dùng "${username}" thất bại: ${error.response?.data?.message || error.message}`);
                    }
                } finally {
                    setLoading(false);
                }
            },
            onCancel() {
                console.log('Hành động xóa đã bị hủy');
            },
        });
    };

    // --- Statistics Modal Functions ---
    const fetchUserStatistics = async () => {
        setStatsLoading(true);
        try {
            const response = await fetchUserStatisticsApi();
            console.log('Phản hồi API đầy đủ cho /overview:', JSON.stringify(response, null, 2));

            if (response && response.result && response.code === 1000) { 
                const statsData = response.result; 

                // 1. Total Users
                setTotalUserCount(statsData.totalUsers || 0);

                // 2. New Users by Month (transform for Column chart)
                const transformedNewUserStats = [];
                if (statsData.newUsersByMonth) {
                    statsData.newUsersByMonth.forEach(monthlyStat => {
                        const monthName = dayjs().month(monthlyStat.month - 1).format('MMM');
                        const yearMonthLabel = `${monthName} ${monthlyStat.year}`;

                        // Exclude ADMIN role data as per request
                        // Use INSTRUCTOR and STUDENT as role names, matching API response
                        // transformedNewUserStats.push({ month: yearMonthLabel, role: 'ADMIN', count: monthlyStat.newAdminCount });
                        transformedNewUserStats.push({ month: yearMonthLabel, role: 'INSTRUCTOR', count: monthlyStat.newInstructorCount }); 
                        transformedNewUserStats.push({ month: yearMonthLabel, role: 'STUDENT', count: monthlyStat.newStudentCount }); 
                    });
                }
                console.log('Thống kê người dùng mới đã chuyển đổi cho Biểu đồ cột:', JSON.stringify(transformedNewUserStats, null, 2));
                setNewUserStats(transformedNewUserStats);

                // 3. Role Distribution (transform for Pie chart)
                if (statsData.roleDistribution) {
                    setRoleDistributionStats(
                        statsData.roleDistribution.map(roleStat => ({
                            type: roleStat.roleName, // This correctly uses ADMIN, INSTRUCTOR, STUDENT from API
                            value: roleStat.count,
                        }))
                    );
                }

                // 4. User Status Distribution (transform for Pie chart)
                if (statsData.userStatusDistribution) {
                    setStatusDistributionStats([
                        { type: 'Kích hoạt', value: statsData.userStatusDistribution.enabledCount },
                        { type: 'Vô hiệu hóa', value: statsData.userStatusDistribution.disabledCount },
                    ]);
                }

            } else {
                // Improved error message for unexpected API response structure or error code
                const errorMessage = response?.message || (response?.code ? `Mã lỗi API: ${response.code}` : 'Định dạng dữ liệu không hợp lệ hoặc không có kết quả từ API');
                message.error(`Lấy thống kê thất bại: ${errorMessage}`);
                setTotalUserCount(0);
                setNewUserStats([]);
                setRoleDistributionStats([]);
                setStatusDistributionStats([]);
            }
        } catch (error) {
            if (handleApiPermissionError(error)) {
                setStatsModalVisible(false);
            } else {
                console.error('Lỗi lấy thống kê người dùng:', error);
                message.error(`Lấy thống kê thất bại: ${error.response?.data?.message || error.message}`);
                setTotalUserCount(0);
                setNewUserStats([]);
                setRoleDistributionStats([]);
                setStatusDistributionStats([]);
            }
        } finally {
            setStatsLoading(false);
        }
    };

    const showStatsModal = () => {
        setStatsModalVisible(true);
        fetchUserStatistics();
    };

    const handleCancelStatsModal = () => {
        setStatsModalVisible(false);
    };
    // --- End Statistics Modal Functions ---

    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
            render: (text) => text || 'N/A',
            sorter: true,
        },
        {
            title: 'Họ và tên',
            key: 'fullName',
            render: (_, record) => `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A'
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            render: (gender) => {
                if (!gender) return 'N/A';
                return gender === 'MALE' ? 'Nam' : (gender === 'FEMALE' ? 'Nữ' : 'Khác');
            }
        },
        {
            title: 'Vai trò',
            key: 'roles',
            render: (_, record) => (
                <Space direction="vertical">
                    {record.roles.map((role) => (
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
                </Space>
            )
        },
        {
            title: 'Trạng thái',
            key: 'enabled',
            render: (_, record) => (
                <Switch
                    checked={record.enabled}
                    onChange={(checked) => handleStatusChange(record.id, checked)}
                    checkedChildren={<UnlockOutlined />}
                    unCheckedChildren={<LockOutlined />}
                />
            )
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button 
                            type="primary" 
                            icon={<UserOutlined />}
                            onClick={() => showUserDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa người dùng">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => showEditModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Thay đổi mật khẩu">
                        <Button 
                            icon={<KeyOutlined />} 
                            onClick={() => showChangePasswordModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa người dùng">
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => handleDeleteUser(record.id, record.username)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    if (permissionError) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Title level={2} style={{ marginBottom: '20px' }}>Bạn không có quyền truy cập</Title>
                <Button type="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <Input
                    placeholder="Lọc theo Tên đăng nhập"
                    value={filterUsername}
                    onChange={(e) => setFilterUsername(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Input
                    placeholder="Lọc theo Tên"
                    value={filterFirstName}
                    onChange={(e) => setFilterFirstName(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Input
                    placeholder="Lọc theo Họ"
                    value={filterLastName}
                    onChange={(e) => setFilterLastName(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Select
                    placeholder="Lọc theo Trạng thái"
                    value={filterEnabled}
                    onChange={(value) => handleFilterChange(value, setFilterEnabled)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value={true}>Kích hoạt</Option>
                    <Option value={false}>Vô hiệu hóa</Option>
                </Select>
                <Select
                    placeholder="Lọc theo Giới tính"
                    value={filterGender}
                    onChange={(value) => handleFilterChange(value, setFilterGender)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value="MALE">Nam</Option>
                    <Option value="FEMALE">Nữ</Option>
                    <Option value="OTHER">Khác</Option>
                </Select>
                <DatePicker
                    placeholder="Tạo từ ngày"
                    value={filterCreatedFrom}
                    onChange={(date) => handleFilterChange(date, setFilterCreatedFrom)}
                    style={{ width: '200px' }}
                />
                <DatePicker
                    placeholder="Tạo đến ngày"
                    value={filterCreatedTo}
                    onChange={(date) => handleFilterChange(date, setFilterCreatedTo)}
                    style={{ width: '200px' }}
                />
                <Select
                    placeholder="Lọc theo Vai trò"
                    value={filterRoles}
                    onChange={(value) => handleFilterChange(value, setFilterRoles)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value="ADMIN">Quản trị viên</Option>
                    <Option value="INSTRUCTOR">Giảng viên</Option>
                    <Option value="STUDENT">Học viên</Option>
                </Select>
                <Button type="primary" onClick={fetchData}>
                    Áp dụng Bộ lọc
                </Button>
                <Button onClick={handleResetFilters}>
                    Đặt lại Bộ lọc
                </Button>
                <Button icon={<BarChartOutlined />} onClick={showStatsModal} style={{ marginLeft: 'auto' }}>
                    Thống kê Người dùng
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title="Chi tiết Người dùng"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedUser && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            {selectedUser.avatarUrl ? (
                                <img 
                                    src={`http://localhost:8080/lms${selectedUser.avatarUrl}`} 
                                    alt={`Ảnh đại diện của ${selectedUser.username || 'Người dùng'}`}
                                    style={{ 
                                        width: '100px', 
                                        height: '100px', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover' 
                                    }} 
                                />
                            ) : (
                                <UserOutlined 
                                    style={{ 
                                        fontSize: '100px',
                                        color: '#ccc',
                                    }} 
                                />
                            )}
                        </div>
                        <p><strong>Tên đăng nhập:</strong> {selectedUser.username || 'N/A'}</p>
                        <p><strong>Họ và tên:</strong> {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                        <p><strong>Điện thoại:</strong> {selectedUser.phone || 'N/A'}</p>
                        <p><strong>Giới tính:</strong> {selectedUser.gender ? (selectedUser.gender === 'MALE' ? 'Nam' : (selectedUser.gender === 'FEMALE' ? 'Nữ' : 'Khác')) : 'N/A'}</p>
                        <p><strong>Ngày sinh:</strong> {selectedUser.dob || 'N/A'}</p>
                        <p><strong>Ngày tạo:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
                        <p><strong>Vai trò:</strong></p>
                        <Space wrap>
                            {selectedUser.roles.map((role) => (
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
                        </Space>
                        <p><strong>Trạng thái:</strong> {selectedUser.enabled ? 'Hoạt động' : 'Không hoạt động'}</p>
                    </div>
                )}
            </Modal>

            {editingUser && (
                <Modal
                    title="Chỉnh sửa Thông tin Người dùng"
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
                        <Form.Item
                            name="phone"
                            label="Điện thoại"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="gender"
                            label="Giới tính"
                        >
                            <Select placeholder="Chọn giới tính" allowClear>
                                <Option value="MALE">Nam</Option>
                                <Option value="FEMALE">Nữ</Option>
                                <Option value="OTHER">Khác</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="dob"
                            label="Ngày sinh"
                        >
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

            {userForPasswordChange && (
                <Modal
                    title={`Thay đổi mật khẩu cho ${userForPasswordChange.username}`}
                    open={changePasswordModalVisible}
                    onCancel={handleCancelChangePasswordModal}
                    onOk={() => changePasswordForm.submit()}
                    confirmLoading={loading}
                    width={400}
                >
                    <Form form={changePasswordForm} layout="vertical" onFinish={handleChangePassword}>
                        <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                            ]}
                            hasFeedback
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận Mật khẩu mới"
                            dependencies={['newPassword']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Hai mật khẩu bạn đã nhập không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    </Form>
                </Modal>
            )}

            {/* Statistics Modal */}
            <Modal
                title="Thống kê Người dùng"
                open={statsModalVisible}
                onCancel={handleCancelStatsModal}
                footer={null}
                width={1000}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                {statsLoading ? (
                    <p>Đang tải thống kê...</p>
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Statistic title="Tổng số Người dùng Đăng ký" value={totalUserCount} />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Giảng viên" 
                                        value={roleDistributionStats.find(r => r.type === 'INSTRUCTOR')?.value || 0} 
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Học viên" 
                                        value={roleDistributionStats.find(r => r.type === 'STUDENT')?.value || 0} 
                                    />
                                </Col>
                            </Row>
                        </Card>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card title="Người dùng mới theo Tháng & Vai trò">
                                    {newUserStats.length > 0 ? (
                                        <Line
                                            data={newUserStats}
                                            xField='month'
                                            yField='count'
                                            seriesField='role'
                                            height={300}
                                            legend={{ position: 'top-right' }}
                                            color={({ role }) => {
                                                if (role === 'INSTRUCTOR') return '#ff4d4f';
                                                if (role === 'STUDENT') return '#52c41a';
                                                return '#8884d8';
                                            }}
                                        />
                                    ) : <p>Không có dữ liệu cho biểu đồ người dùng mới.</p>}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Phân bổ Vai trò Người dùng">
                                    {roleDistributionStats.length > 0 ? (
                                        <Pie
                                            data={roleDistributionStats}
                                            angleField='value'
                                            colorField='type'
                                            radius={0.8}
                                            height={300}
                                            label={{
                                                offset: '-30%',
                                                content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                                                style: { fontSize: 14, textAlign: 'center' },
                                            }}
                                            interactions={[{ type: 'element-active' }]}
                                            legend={{ position: 'top-right' }}
                                        />
                                    ) : <p>Không có dữ liệu cho biểu đồ phân bổ vai trò.</p>}
                                </Card>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}> 
                                <Card title="Phân bổ Trạng thái Người dùng (Kích hoạt/Vô hiệu hóa)">
                                   {statusDistributionStats.length > 0 ? (
                                        <Pie
                                            data={statusDistributionStats}
                                            angleField='value'
                                            colorField='type'
                                            radius={0.8}
                                            height={300}
                                            label={{
                                                offset: '-30%',
                                                content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                                                style: { fontSize: 14, textAlign: 'center' },
                                            }}
                                            interactions={[{ type: 'element-active' }]}
                                            legend={{ position: 'top-right' }}
                                        />
                                    ) : <p>Không có dữ liệu cho biểu đồ phân bổ trạng thái.</p>}
                                </Card>
                            </Col>
                        </Row>
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement; 
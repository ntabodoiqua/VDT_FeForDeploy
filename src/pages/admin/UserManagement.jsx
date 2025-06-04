import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Tag, Switch, message, Modal, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosInstance from '../../util/axios.customize';

const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchUsers = async (page = 1, pageSize = 20) => {
        try {
            setLoading(true);
            const url = `/lms/admin/manage-users?page=${page - 1}&size=${pageSize}`;
            console.log('Request URL:', url);

            const response = await axiosInstance.get(url);
            console.log('API Response:', response);

            if (response.code === 1000) {
                const { content, totalElements, totalPages, number } = response.result;
                setUsers(content);
                setPagination({
                    current: number + 1,
                    pageSize,
                    total: totalElements
                });
            } else {
                console.error('API Error Code:', response.code);
                message.error(`Failed to fetch users: ${response.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            message.error(`Failed to fetch users: ${error.response?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleTableChange = (pagination) => {
        fetchUsers(pagination.current, pagination.pageSize);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        // Implement search logic here
    };

    const handleRoleFilter = (value) => {
        setRoleFilter(value);
        // Implement role filter logic here
    };

    const handleStatusChange = async (userId, enabled) => {
        try {
            // Implement API call to update user status
            // await axiosInstance.put(`/lms/admin/users/${userId}/status`, { enabled });
            message.success(`User ${enabled ? 'enabled' : 'disabled'} successfully`);
            fetchUsers(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('Error updating user status:', error);
            message.error('Failed to update user status');
        }
    };

    const showUserDetails = (user) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Full Name',
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
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text || 'N/A'
        },
        {
            title: 'Gender',
            dataIndex: 'gender',
            key: 'gender',
            render: (gender) => {
                if (!gender) return 'N/A';
                return gender === 'MALE' ? 'Male' : 'Female';
            }
        },
        {
            title: 'Roles',
            key: 'roles',
            render: (_, record) => (
                <Space>
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
            title: 'Status',
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
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button 
                            type="primary" 
                            icon={<UserOutlined />}
                            onClick={() => showUserDetails(record)}
                        >
                            Details
                        </Button>
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <Input
                    placeholder="Search users..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: '300px' }}
                />
                <Select
                    defaultValue="all"
                    style={{ width: '200px' }}
                    onChange={handleRoleFilter}
                >
                    <Option value="all">All Roles</Option>
                    <Option value="ADMIN">Admin</Option>
                    <Option value="INSTRUCTOR">Instructor</Option>
                    <Option value="STUDENT">Student</Option>
                </Select>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
            />

            <Modal
                title="User Details"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedUser && (
                    <div>
                        <p><strong>Username:</strong> {selectedUser.username || 'N/A'}</p>
                        <p><strong>Full Name:</strong> {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                        <p><strong>Gender:</strong> {selectedUser.gender || 'N/A'}</p>
                        <p><strong>Date of Birth:</strong> {selectedUser.dob || 'N/A'}</p>
                        <p><strong>Created At:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
                        <p><strong>Roles:</strong></p>
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
                        <p><strong>Status:</strong> {selectedUser.enabled ? 'Active' : 'Inactive'}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement; 
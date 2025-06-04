import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Space, Button, Input, Select, Tag, Switch, message, Modal, Tooltip, DatePicker } from 'antd';
import { SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosInstance from '../../util/axios.customize';
import { debounce } from 'lodash';

const { Option } = Select;

const UserManagement = () => {
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
        console.log('Request URL:', url);

        try {
            setLoading(true);
            const response = await axiosInstance.get(url);
            console.log('API Response:', response);

            if (response.code === 1000) {
                const { content, totalElements, number } = response.result;
                setUsers(content);
                setPagination(prev => ({
                    ...prev,
                    current: number + 1,
                    total: totalElements
                }));
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
    }, [
        pagination.current, pagination.pageSize, currentSorter,
        filterUsername, filterFirstName, filterLastName, filterEnabled,
        filterGender, filterCreatedFrom, filterCreatedTo, filterRoles
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (newPagination, filters, sorter) => {
        console.log('Table change:', newPagination, filters, sorter);
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
            await axiosInstance.put(`/api/users/${userId}/status`, { enabled });
            message.success(`User ${enabled ? 'enabled' : 'disabled'} successfully`);
            fetchData();
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
            render: (text) => text || 'N/A',
            sorter: true,
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
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <Input
                    placeholder="Filter by Username (Press Enter)"
                    value={filterUsername}
                    onChange={(e) => setFilterUsername(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Input
                    placeholder="Filter by First Name (Press Enter)"
                    value={filterFirstName}
                    onChange={(e) => setFilterFirstName(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Input
                    placeholder="Filter by Last Name (Press Enter)"
                    value={filterLastName}
                    onChange={(e) => setFilterLastName(e.target.value)}
                    style={{ width: '200px' }}
                />
                <Select
                    placeholder="Filter by Enabled"
                    value={filterEnabled}
                    onChange={(value) => handleFilterChange(value, setFilterEnabled)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value={true}>Enabled</Option>
                    <Option value={false}>Disabled</Option>
                </Select>
                <Select
                    placeholder="Filter by Gender"
                    value={filterGender}
                    onChange={(value) => handleFilterChange(value, setFilterGender)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value="MALE">Male</Option>
                    <Option value="FEMALE">Female</Option>
                    <Option value="OTHER">Other</Option>
                </Select>
                <DatePicker
                    placeholder="Created From"
                    value={filterCreatedFrom}
                    onChange={(date) => handleFilterChange(date, setFilterCreatedFrom)}
                    style={{ width: '200px' }}
                />
                <DatePicker
                    placeholder="Created To"
                    value={filterCreatedTo}
                    onChange={(date) => handleFilterChange(date, setFilterCreatedTo)}
                    style={{ width: '200px' }}
                />
                <Select
                    placeholder="Filter by Roles"
                    value={filterRoles}
                    onChange={(value) => handleFilterChange(value, setFilterRoles)}
                    style={{ width: '200px' }}
                    allowClear
                >
                    <Option value="ADMIN">Admin</Option>
                    <Option value="INSTRUCTOR">Instructor</Option>
                    <Option value="STUDENT">Student</Option>
                </Select>
                <Button type="primary" onClick={fetchData}>
                    Apply Filters
                </Button>
                <Button onClick={handleResetFilters}>
                    Reset Filters
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
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, message, Image, Switch, Tooltip, Descriptions, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const API_URL = 'http://localhost:8080/lms/courses';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingCourse, setEditingCourse] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10, // Default page size
        total: 0,
    });

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null; // Or a placeholder image URL

        // If it's already an absolute URL, use it directly
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }

        // If it's a path starting with '/', assume it's from the API and needs prefixing
        // and URI encoding for special characters in the path (like spaces).
        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        
        // Fallback for unexpected formats, log a warning
        console.warn(`getDisplayImageUrl: Encountered an image path in an unexpected format: ${urlPath}`);
        return urlPath; 
    };

    const columns = [
        {
            title: 'Tên khóa học',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Ảnh đại diện',
            dataIndex: 'thumbnailUrl',
            key: 'thumbnail',
            render: (thumbnailUrl) => {
                const fullUrl = getDisplayImageUrl(thumbnailUrl);
                return fullUrl ? <Image width={50} src={fullUrl} alt="Thumbnail" /> : 'N/A';
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Giảng viên',
            dataIndex: 'instructor',
            key: 'instructor',
            render: (instructor) => instructor ? `${instructor.firstName} ${instructor.lastName} (${instructor.username})` : 'N/A',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'active', // Changed from 'status'
            key: 'active',
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={(checked) => handleStatusToggle(record, checked)}
                    // TODO: Add loading state for individual switch if desired
                />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const fetchCourses = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        const apiUrl = `${API_URL}?page=${page - 1}&size=${pageSize}`;
        console.log("Fetching courses with URL:", apiUrl);

        const token = localStorage.getItem('access_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(apiUrl, { headers });
            console.log("Fetch courses raw response:", response);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch courses response error text:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const data = await response.json();
            console.log("Fetch courses response data:", data);
            if (data.code === 1000 && data.result) {
                setCourses(data.result.content);
                setPagination({
                    current: data.result.pageable.pageNumber + 1,
                    pageSize: data.result.pageable.pageSize,
                    total: data.result.totalElements,
                });
            } else {
                message.error(data.message || 'Không thể tải danh sách khóa học');
            }
        } catch (error) {
            console.error("Fetch courses error object:", error);
            message.error('Không thể tải danh sách khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleViewDetails = async (course) => {
        console.log("View details for course:", course);
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}/${course.id}`, { headers });
            console.log("View details raw response:", response);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("View details response error text:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const data = await response.json();
            console.log("View details response data:", data);
            if (data.code === 1000 && data.result) {
                setSelectedCourseDetails(data.result);
                setViewModalVisible(true);
            } else {
                message.error(data.message || 'Không thể tải chi tiết khóa học');
            }
        } catch (error) {
            console.error("View details error object:", error);
            message.error('Không thể tải chi tiết khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (course, newActiveStatus) => {
        console.log("Toggling status for course:", course, "to new status:", newActiveStatus);

        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // setLoading(true); // Consider per-switch loading state for better UX

        try {
            const toggleUrl = `${API_URL}/${course.id}/toggle-status`; // Example endpoint
            const payload = { active: newActiveStatus }; // Client intends to set this status
            console.log("Simulating PATCH request to:", toggleUrl, "with payload:", payload, "and headers:", headers);
            
            // TODO: Implement ACTUAL API call to update course status
            // Example: 
            // const response = await fetch(toggleUrl, { 
            // method: 'PATCH', 
            // body: JSON.stringify(payload), 
            // headers
            // });
            // if (!response.ok) throw new Error('API call failed');
            // const apiResponseData = await response.json();

            // Simulate API call success and response with an "enabled" field
            // For simulation, we'll assume the API confirms the intended change.
            // In a real scenario, apiResponseData.result.enabled might differ based on backend logic.
            const simulatedApiResponse = {
                code: 1000,
                result: {
                    ...course, // Keep other course properties
                    enabled: newActiveStatus // API confirms the new status in 'enabled' field
                },
                message: "Trạng thái khóa học được cập nhật thành công (giả lập)"
            };
            console.log("Simulated API Response for toggle:", simulatedApiResponse);

            if (simulatedApiResponse.code === 1000 && simulatedApiResponse.result) {
                const actualStatusFromApi = simulatedApiResponse.result.enabled;

                setCourses(prevCourses =>
                    prevCourses.map(c =>
                        c.id === course.id ? { ...c, active: actualStatusFromApi } : c
                    )
                );
                message.success(`Khóa học "${course.title}" ${actualStatusFromApi ? 'đã được mở' : 'đã được đóng'} (giả lập).`);
            } else {
                message.error(simulatedApiResponse.message || 'Không thể cập nhật trạng thái khóa học (lỗi giả lập).');
                // If the switch was optimistically updated, you might want to revert it here
            }

        } catch (error) {
            console.error("Toggle status error:", error, "for course:", course, "newStatus:", newActiveStatus);
            message.error('Không thể cập nhật trạng thái khóa học: ' + error.message);
            // setLoading(false); // Ensure loading is turned off on error
        }
    };

    const handleTableChange = (newPagination) => {
        fetchCourses(newPagination.current, newPagination.pageSize);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        // Map API data to form fields
        form.setFieldsValue({
            ...course,
            instructor: course.instructor ? course.instructor.username : undefined, // Assuming form expects instructor username
            // price field will remain as is, might not be populated if not in API response
        });
        setModalVisible(true);
    };

    const handleDelete = async (course) => {
        console.log("Attempting to delete course:", course);

        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setLoading(true);
                const token = localStorage.getItem('access_token');
                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                try {
                    const deleteUrl = `${API_URL}/${course.id}`;
                    console.log("Sending DELETE request to:", deleteUrl, "with headers:", headers);
                    const response = await fetch(deleteUrl, { method: 'DELETE', headers });
                    console.log("Delete course raw response:", response);

                    if (response.ok) {
                        const data = await response.json(); // Assuming API returns JSON like { code: 1000, message: "..." }
                        console.log("Delete course response data:", data);
                        if (data.code === 1000) {
                            message.success(data.message || 'Xóa khóa học thành công');
                            fetchCourses(pagination.current, pagination.pageSize); // Refresh current page
                        } else {
                            message.error(data.message || 'Không thể xóa khóa học. Lỗi từ API.');
                        }
                    } else {
                        const errorText = await response.text();
                        console.error("Delete course response error text:", errorText);
                        message.error(`Không thể xóa khóa học. Lỗi máy chủ: ${response.status} - ${errorText}`);
                    }
                } catch (error) {
                    console.error("Delete course error object:", error, "for course:", course);
                    message.error('Không thể xóa khóa học: ' + error.message);
                } finally {
                    setLoading(false);
                }
            },
            onCancel: () => {
                console.log('Hủy xóa khóa học');
            },
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        console.log("Form submitted with values:", values);

        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const payload = { ...values };
            console.log("API payload:", payload);
            // TODO: Potentially map instructor username back to an ID or full object if API expects that

            if (editingCourse) {
                const updateUrl = `${API_URL}/${editingCourse.id}`;
                console.log("Attempting to update course (PUT request to):", updateUrl, "with payload:", payload, "and headers:", headers);
                // TODO: Implement API call to update course
                // For example: await fetch(updateUrl, { method: 'PUT', body: JSON.stringify(payload), headers });
                // Simulate API response
                const simulatedResponse = { success: true, data: { ...editingCourse, ...payload }, message: "Update successful (simulated)" };
                console.log("Simulated update response:", simulatedResponse);
                message.success('Cập nhật khóa học thành công ( giả lập )');
            } else {
                console.log("Attempting to create course (POST request to):", API_URL, "with payload:", payload, "and headers:", headers);
                // TODO: Implement API call to create course
                // For example: await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload), headers });
                // Simulate API response
                const simulatedResponse = { success: true, data: { id: Date.now(), ...payload }, message: "Creation successful (simulated)" }; // Simulate new ID
                console.log("Simulated create response:", simulatedResponse);
                message.success('Tạo khóa học thành công ( giả lập )');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingCourse(null);
            fetchCourses(editingCourse ? pagination.current : 1, pagination.pageSize); // Refresh: current page if editing, first page if creating
        } catch (error) {
            console.error("Submit course error:", error, "Values:", values, "Editing course:", editingCourse);
            message.error('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingCourse(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm khóa học
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={courses}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingCourse ? 'Sửa khóa học' : 'Thêm khóa học'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingCourse(null);
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title" // Changed from "name"
                        label="Tên khóa học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên khóa học' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item
                        name="instructor"
                        label="Giảng viên"
                        rules={[{ required: true, message: 'Vui lòng chọn giảng viên' }]}
                    >
                        <Select placeholder="Chọn giảng viên">
                            {/* TODO: Fetch and populate instructors dynamically */}
                            {/* For now, this allows manual input or relies on existing value for edit */}
                            {editingCourse && editingCourse.instructor && (
                                <Option value={editingCourse.instructor.username}>
                                    {`${editingCourse.instructor.firstName} ${editingCourse.instructor.lastName} (${editingCourse.instructor.username})`}
                                </Option>
                            )}
                            {/* Add more options if you have a list of instructors */}
                             <Option value="Nguyễn Văn A">Nguyễn Văn A (Hardcoded)</Option>
                             <Option value="Trần Thị B">Trần Thị B (Hardcoded)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="active" // Changed from "status"
                        label="Trạng thái"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select>
                            <Option value={true}>Đang mở</Option>
                            <Option value={false}>Đã đóng</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingCourse ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingCourse(null);
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {selectedCourseDetails && (
                <Modal
                    title="Chi tiết khóa học"
                    open={viewModalVisible}
                    onCancel={() => {
                        setViewModalVisible(false);
                        setSelectedCourseDetails(null);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setViewModalVisible(false);
                            setSelectedCourseDetails(null);
                        }}>
                            Đóng
                        </Button>
                    ]}
                    width={800}
                >
                    <Descriptions bordered column={1} layout="horizontal">
                        <Descriptions.Item label="ID">{selectedCourseDetails.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên khóa học">{selectedCourseDetails.title}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{selectedCourseDetails.description}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả chi tiết">{selectedCourseDetails.detailedDescription}</Descriptions.Item>
                        <Descriptions.Item label="Ảnh đại diện">
                            {selectedCourseDetails.thumbnailUrl ? (
                                <Image 
                                    width={100} 
                                    src={getDisplayImageUrl(selectedCourseDetails.thumbnailUrl)}
                                    alt={selectedCourseDetails.title} 
                                />
                            ) : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng số bài học">{selectedCourseDetails.totalLessons}</Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu">{selectedCourseDetails.startDate ? new Date(selectedCourseDetails.startDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày kết thúc">{selectedCourseDetails.endDate ? new Date(selectedCourseDetails.endDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{selectedCourseDetails.createdAt ? new Date(selectedCourseDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Cập nhật gần nhất">{selectedCourseDetails.updatedAt ? new Date(selectedCourseDetails.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                        {selectedCourseDetails.instructor && (
                            <Descriptions.Item label="Giảng viên">
                                {`${selectedCourseDetails.instructor.firstName} ${selectedCourseDetails.instructor.lastName} (${selectedCourseDetails.instructor.username})`}
                                {selectedCourseDetails.instructor.avatarUrl && 
                                    <Image width={50} src={getDisplayImageUrl(selectedCourseDetails.instructor.avatarUrl)} alt="avatar" style={{ marginLeft: 10, borderRadius: '50%'}} />}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Yêu cầu duyệt">{selectedCourseDetails.requiresApproval ? <Tag color="warning">Có</Tag> : <Tag color="default">Không</Tag>}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{selectedCourseDetails.active ? <Tag color="success">Đang mở</Tag> : <Tag color="error">Đã đóng</Tag>}</Descriptions.Item>
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
};

export default CourseManagement; 
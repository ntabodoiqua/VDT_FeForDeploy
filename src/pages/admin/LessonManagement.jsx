import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { fetchAllSystemLessonsApi } from '../../util/api'; // Import the shared API function

const { Option } = Select;
const { TextArea } = Input;

const LessonManagement = () => {
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingLesson, setEditingLesson] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedLessonDetails, setSelectedLessonDetails] = useState(null);

    const columns = [
        {
            title: 'Tên bài học',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Mô tả',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: 'Giảng viên',
            dataIndex: ['createdBy', 'username'],
            key: 'instructorName',
            render: (username, record) => record.createdBy ? record.createdBy.username : 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="dashed"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                    >
                        Xem
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const fetchLessons = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            // The shared fetchAllSystemLessonsApi will use the customized Axios instance,
            // which should handle token and base URL automatically.
            const params = { page: page - 1, size: pageSize };
            const apiResponse = await fetchAllSystemLessonsApi(params);

            if (apiResponse && typeof apiResponse.code !== 'undefined') {
                if (apiResponse.code === 1000 && apiResponse.result) {
                    setLessons(apiResponse.result.content || []);
                    setPagination({
                        current: (apiResponse.result.pageable?.pageNumber || 0) + 1,
                        pageSize: apiResponse.result.pageable?.pageSize || pageSize,
                        total: apiResponse.result.totalElements || 0,
                    });
                } else {
                    message.error(apiResponse.message || 'Không thể tải danh sách bài học từ API.');
                }
            } else {
                message.error('Phản hồi không hợp lệ từ API khi tải danh sách bài học.');
            }
        } catch (error) {
            console.error("Fetch lessons error:", error);
            let errorMessage = 'Không thể tải danh sách bài học.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.data && error.data.message) { // If error itself contains data.message
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            // TODO: Implement API call to fetch courses
            // const response = await fetchCoursesApi();
            // setCourses(response.data);
            const accessToken = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            // Example of how you might fetch courses with token, though API endpoint is not specified for this yet
            // const response = await fetch(`http://localhost:8080/lms/courses`, { // Assuming an endpoint
            //     method: 'GET',
            //     headers: headers,
            // });
            // if (!response.ok) throw new Error('Failed to fetch courses');
            // const data = await response.json();
            // if (data.code === 1000 && data.result) {
            //     setCourses(data.result.content || data.result); // Adjust based on actual API response for courses
            // } else {
            //     message.error(data.message || 'Không thể tải danh sách khóa học');
            // }

            // Temporary mock data
            setCourses([
                {
                    id: 1,
                    name: 'Lập trình React cơ bản'
                },
                {
                    id: 2,
                    name: 'Lập trình Node.js nâng cao'
                }
            ]);
        } catch (error) {
            message.error('Không thể tải danh sách khóa học');
        }
    };

    useEffect(() => {
        fetchLessons(pagination.current, pagination.pageSize);
        fetchCourses();
    }, []);

    const handleViewDetails = (lesson) => {
        setSelectedLessonDetails(lesson);
        setViewModalVisible(true);
    };

    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        form.setFieldsValue(lesson);
        setModalVisible(true);
    };

    const handleDelete = async (lesson) => {
        try {
            // TODO: Implement API call to delete lesson
            const accessToken = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            // await deleteLessonApi(lesson.id, { headers }); // Pass headers to your API call
            message.success('Xóa bài học thành công');
            fetchLessons(pagination.current, pagination.pageSize);
        } catch (error) {
            message.error('Không thể xóa bài học');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            if (editingLesson) {
                // TODO: Implement API call to update lesson
                // await updateLessonApi(editingLesson.id, values, { headers }); // Pass headers
                message.success('Cập nhật bài học thành công');
            } else {
                // TODO: Implement API call to create lesson
                // await createLessonApi(values, { headers }); // Pass headers
                message.success('Tạo bài học thành công');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingLesson(null);
            fetchLessons(pagination.current, pagination.pageSize);
        } catch (error) {
            message.error('Có lỗi xảy ra');
        }
    };

    const handleTableChange = (newPagination) => {
        fetchLessons(newPagination.current, newPagination.pageSize);
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingLesson(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm bài học
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={lessons}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingLesson ? 'Sửa bài học' : 'Thêm bài học'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingLesson(null);
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
                        name="courseId"
                        label="Khóa học"
                        rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}
                    >
                        <Select>
                            {courses.map(course => (
                                <Option key={course.id} value={course.id}>{course.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="title"
                        label="Tên bài học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên bài học' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingLesson ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingLesson(null);
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {selectedLessonDetails && (
                <Modal
                    title="Chi tiết bài học"
                    open={viewModalVisible}
                    onCancel={() => {
                        setViewModalVisible(false);
                        setSelectedLessonDetails(null);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setViewModalVisible(false);
                            setSelectedLessonDetails(null);
                        }}>
                            Đóng
                        </Button>,
                    ]}
                    width={800}
                >
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="ID">{selectedLessonDetails.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên bài học">{selectedLessonDetails.title}</Descriptions.Item>
                        <Descriptions.Item label="Nội dung">{selectedLessonDetails.content}</Descriptions.Item>
                        <Descriptions.Item label="Video URL">
                            {selectedLessonDetails.videoUrl ? <a href={selectedLessonDetails.videoUrl} target="_blank" rel="noopener noreferrer">{selectedLessonDetails.videoUrl}</a> : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tài liệu đính kèm">
                            {selectedLessonDetails.attachmentUrl ? <a href={selectedLessonDetails.attachmentUrl} target="_blank" rel="noopener noreferrer">{selectedLessonDetails.attachmentUrl}</a> : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{new Date(selectedLessonDetails.createdAt).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">{new Date(selectedLessonDetails.updatedAt).toLocaleString()}</Descriptions.Item>
                        {selectedLessonDetails.createdBy && (
                            <>
                                <Descriptions.Item label="Người tạo (Username)">{selectedLessonDetails.createdBy.username}</Descriptions.Item>
                                <Descriptions.Item label="Người tạo (Tên)">{`${selectedLessonDetails.createdBy.lastName || ''} ${selectedLessonDetails.createdBy.firstName || ''}`.trim()}</Descriptions.Item>
                                <Descriptions.Item label="Người tạo (Email)">{selectedLessonDetails.createdBy.email || 'N/A'}</Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
};

export default LessonManagement; 
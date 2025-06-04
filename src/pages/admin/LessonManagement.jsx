import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const LessonManagement = () => {
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingLesson, setEditingLesson] = useState(null);

    const columns = [
        {
            title: 'Tên bài học',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Khóa học',
            dataIndex: 'courseName',
            key: 'courseName',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
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

    const fetchLessons = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch lessons
            // const response = await fetchLessonsApi();
            // setLessons(response.data);
            
            // Temporary mock data
            setLessons([
                {
                    id: 1,
                    name: 'Giới thiệu về React',
                    courseName: 'Lập trình React cơ bản',
                    courseId: 1,
                    description: 'Tổng quan về React và các khái niệm cơ bản',
                    order: 1,
                    status: 'ACTIVE'
                },
                {
                    id: 2,
                    name: 'Components và Props',
                    courseName: 'Lập trình React cơ bản',
                    courseId: 1,
                    description: 'Tìm hiểu về Components và Props trong React',
                    order: 2,
                    status: 'ACTIVE'
                }
            ]);
        } catch (error) {
            message.error('Không thể tải danh sách bài học');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            // TODO: Implement API call to fetch courses
            // const response = await fetchCoursesApi();
            // setCourses(response.data);
            
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
        fetchLessons();
        fetchCourses();
    }, []);

    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        form.setFieldsValue(lesson);
        setModalVisible(true);
    };

    const handleDelete = async (lesson) => {
        try {
            // TODO: Implement API call to delete lesson
            // await deleteLessonApi(lesson.id);
            message.success('Xóa bài học thành công');
            fetchLessons();
        } catch (error) {
            message.error('Không thể xóa bài học');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingLesson) {
                // TODO: Implement API call to update lesson
                // await updateLessonApi(editingLesson.id, values);
                message.success('Cập nhật bài học thành công');
            } else {
                // TODO: Implement API call to create lesson
                // await createLessonApi(values);
                message.success('Tạo bài học thành công');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingLesson(null);
            fetchLessons();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        }
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
                        name="name"
                        label="Tên bài học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên bài học' }]}
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
                        name="order"
                        label="Thứ tự"
                        rules={[{ required: true, message: 'Vui lòng nhập thứ tự' }]}
                    >
                        <Input type="number" min={1} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select>
                            <Option value="ACTIVE">Đang mở</Option>
                            <Option value="INACTIVE">Đã đóng</Option>
                        </Select>
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
        </div>
    );
};

export default LessonManagement; 
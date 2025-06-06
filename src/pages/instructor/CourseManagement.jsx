import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingCourse, setEditingCourse] = useState(null);

    const columns = [
        {
            title: 'Tên khóa học',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`
        },
        {
            title: 'Số học viên',
            dataIndex: 'studentCount',
            key: 'studentCount',
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

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch instructor's courses
            // const response = await fetchInstructorCoursesApi();
            // setCourses(response.data);
            
            // Temporary mock data
            setCourses([
                {
                    id: 1,
                    name: 'Lập trình React cơ bản',
                    description: 'Khóa học lập trình React dành cho người mới bắt đầu',
                    price: 1000000,
                    studentCount: 50,
                    status: 'ACTIVE'
                },
                {
                    id: 2,
                    name: 'Lập trình Node.js nâng cao',
                    description: 'Khóa học Node.js dành cho người đã có kinh nghiệm',
                    price: 2000000,
                    studentCount: 30,
                    status: 'ACTIVE'
                }
            ]);
        } catch (error) {
            message.error('Không thể tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleEdit = (course) => {
        setEditingCourse(course);
        form.setFieldsValue(course);
        setModalVisible(true);
    };

    const handleDelete = async (course) => {
        try {
            // TODO: Implement API call to delete course
            // await deleteCourseApi(course.id);
            message.success('Xóa khóa học thành công');
            fetchCourses();
        } catch (error) {
            message.error('Không thể xóa khóa học');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingCourse) {
                // TODO: Implement API call to update course
                // await updateCourseApi(editingCourse.id, values);
                message.success('Cập nhật khóa học thành công');
            } else {
                // TODO: Implement API call to create course
                // await createCourseApi(values);
                message.success('Tạo khóa học thành công');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingCourse(null);
            fetchCourses();
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
                        name="name"
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
                        name="price"
                        label="Giá"
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select>
                            <Select.Option value="ACTIVE">Đang mở</Select.Option>
                            <Select.Option value="INACTIVE">Đã đóng</Select.Option>
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
        </div>
    );
};

export default CourseManagement; 
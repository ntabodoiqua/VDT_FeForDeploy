import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, message, Modal } from 'antd';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const categories = [
        { value: 'all', label: 'Tất cả' },
        { value: 'programming', label: 'Lập trình' },
        { value: 'design', label: 'Thiết kế' },
        { value: 'business', label: 'Kinh doanh' }
    ];

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch available courses
            // const response = await fetchAvailableCoursesApi();
            // setCourses(response.data);
            
            // Temporary mock data
            setCourses([
                {
                    id: 1,
                    title: 'Lập trình React cơ bản',
                    description: 'Khóa học lập trình React dành cho người mới bắt đầu',
                    instructor: 'Nguyễn Văn A',
                    price: 1000000,
                    category: 'programming',
                    image: 'https://via.placeholder.com/300x200',
                    rating: 4.5,
                    studentCount: 100
                },
                {
                    id: 2,
                    title: 'Lập trình Node.js nâng cao',
                    description: 'Khóa học Node.js dành cho người đã có kinh nghiệm',
                    instructor: 'Trần Thị B',
                    price: 2000000,
                    category: 'programming',
                    image: 'https://via.placeholder.com/300x200',
                    rating: 4.8,
                    studentCount: 50
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

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
    };

    const handleEnroll = (course) => {
        setSelectedCourse(course);
        setModalVisible(true);
    };

    const handleConfirmEnroll = async () => {
        try {
            // TODO: Implement API call to enroll in course
            // await enrollCourseApi(selectedCourse.id);
            message.success('Đăng ký khóa học thành công');
            setModalVisible(false);
            setSelectedCourse(null);
        } catch (error) {
            message.error('Không thể đăng ký khóa học');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchText.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={16}>
                        <Search
                            placeholder="Tìm kiếm khóa học..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col span={8}>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                        >
                            {categories.map(category => (
                                <Option key={category.value} value={category.value}>
                                    {category.label}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </div>

            <Row gutter={[24, 24]}>
                {filteredCourses.map(course => (
                    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                        <Card
                            hoverable
                            cover={<img alt={course.title} src={course.image} />}
                            actions={[
                                <Button
                                    type="primary"
                                    icon={<ShoppingCartOutlined />}
                                    onClick={() => handleEnroll(course)}
                                >
                                    Đăng ký
                                </Button>
                            ]}
                        >
                            <Card.Meta
                                title={course.title}
                                description={
                                    <>
                                        <p>{course.description}</p>
                                        <p>Giảng viên: {course.instructor}</p>
                                        <p>Học viên: {course.studentCount}</p>
                                        <p>Đánh giá: {course.rating}/5</p>
                                        <p style={{ color: '#f5222d', fontWeight: 'bold' }}>
                                            {course.price.toLocaleString('vi-VN')} VNĐ
                                        </p>
                                    </>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title="Xác nhận đăng ký"
                open={modalVisible}
                onOk={handleConfirmEnroll}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedCourse(null);
                }}
                okText="Đăng ký"
                cancelText="Hủy"
            >
                {selectedCourse && (
                    <div>
                        <p>Bạn có chắc chắn muốn đăng ký khóa học:</p>
                        <p><strong>{selectedCourse.title}</strong></p>
                        <p>Giá: {selectedCourse.price.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CourseList; 
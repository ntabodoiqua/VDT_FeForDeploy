import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, message, Modal, Tag, Rate, Spin, List, Typography, Pagination, Divider, Form, DatePicker, Space } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, TrophyOutlined, EyeOutlined, BookOutlined, PlayCircleOutlined, AppstoreOutlined, ClearOutlined } from '@ant-design/icons';
import { fetchPopularCoursesApi, fetchCategoriesApi, fetchPublicLessonsForCourseApi, fetchCoursesApi } from '../../util/api';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CourseList = () => {
    const [popularCourses, setPopularCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    
    // New states for lessons modal
    const [lessonsModalVisible, setLessonsModalVisible] = useState(false);
    const [courseLessons, setCourseLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);

    // New states for all courses section
    const [allCourses, setAllCourses] = useState([]);
    const [allCoursesLoading, setAllCoursesLoading] = useState(false);
    const [allCoursesFilterForm] = Form.useForm();
    const [allCoursesFilterValues, setAllCoursesFilterValues] = useState({
        title: null,
        instructorName: null,
        category: null,
        isActive: null,
        startDateRange: null,
    });
    const [allCoursesPagination, setAllCoursesPagination] = useState({
        current: 1,
        pageSize: 12,
        total: 0
    });

    // Helper function to get full image URL
    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return 'https://via.placeholder.com/300x200';

        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }

        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        
        return urlPath; 
    };

    // Helper function to get category name
    const getCategoryName = (course) => {
        if (course.category && course.category.name) {
            return course.category.name;
        }
        if (course.categoryId) {
            const foundCategory = categories.find(cat => cat.id === course.categoryId);
            return foundCategory ? foundCategory.name : 'Chưa phân loại';
        }
        if (course.categoryName) {
            return course.categoryName;
        }
        return 'Chưa phân loại';
    };

    const fetchPopularCourses = async () => {
        setLoading(true);
        try {
            // Fetch popular courses from API with limit parameter
            const response = await fetchPopularCoursesApi({ limit: 10 });
            const data = response;
            
            if (data.code === 1000 && data.result) {
                // Popular courses API returns array with course object and enrollmentCount
                setPopularCourses(data.result);
                message.success('Đã tải danh sách khóa học phổ biến');
            } else {
                message.error(data.message || 'Không thể tải danh sách khóa học');
            }
        } catch (error) {
            console.error('Error fetching popular courses:', error);
            message.error('Không thể tải danh sách khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesList = async () => {
        try {
            const response = await fetchCategoriesApi({ page: 0, size: 100 });
            const data = response;
            if (data.code === 1000 && data.result) {
                setCategories(data.result.content || data.result);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchCourseLessons = async (courseId) => {
        setLoadingLessons(true);
        try {
            const response = await fetchPublicLessonsForCourseApi(courseId, { page: 0, size: 50 });
            const data = response;
            
            if (data.code === 1000 && data.result) {
                setCourseLessons(data.result.content || data.result);
            } else {
                message.error(data.message || 'Không thể tải danh sách bài học');
            }
        } catch (error) {
            console.error('Error fetching course lessons:', error);
            message.error('Không thể tải danh sách bài học: ' + error.message);
        } finally {
            setLoadingLessons(false);
        }
    };

    const fetchAllCourses = async (page = 1, pageSize = 12, filtersToApply = allCoursesFilterValues) => {
        setAllCoursesLoading(true);
        try {
            const params = {
                page: page - 1, // Backend expects 0-based indexing
                size: pageSize,
                title: filtersToApply.title || undefined,
                instructorName: filtersToApply.instructorName || undefined,
                category: filtersToApply.category || undefined,
                isActive: filtersToApply.isActive === null || filtersToApply.isActive === 'all' ? undefined : filtersToApply.isActive,
                startDateFrom: filtersToApply.startDateRange?.[0] ? filtersToApply.startDateRange[0].format('YYYY-MM-DD') : undefined,
                startDateTo: filtersToApply.startDateRange?.[1] ? filtersToApply.startDateRange[1].format('YYYY-MM-DD') : undefined,
            };

            // Remove undefined values
            Object.keys(params).forEach(key => (params[key] === undefined || params[key] === '') && delete params[key]);

            const response = await fetchCoursesApi(params);
            const data = response;
            
            if (data.code === 1000 && data.result) {
                setAllCourses(data.result.content || []);
                setAllCoursesPagination({
                    current: page,
                    pageSize: pageSize,
                    total: data.result.totalElements || 0
                });
            } else {
                message.error(data.message || 'Không thể tải danh sách khóa học');
            }
        } catch (error) {
            console.error('Error fetching all courses:', error);
            message.error('Không thể tải danh sách khóa học: ' + error.message);
        } finally {
            setAllCoursesLoading(false);
        }
    };

    useEffect(() => {
        fetchPopularCourses();
        fetchCategoriesList();
        fetchAllCourses(); // Load initial all courses
    }, []);

    // Effect to refetch all courses when filters change  
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (allCoursesFilterValues.title !== null || 
                allCoursesFilterValues.instructorName !== null ||
                allCoursesFilterValues.category !== null ||
                allCoursesFilterValues.isActive !== null ||
                allCoursesFilterValues.startDateRange !== null) {
                fetchAllCourses(1, allCoursesPagination.pageSize, allCoursesFilterValues);
            }
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [allCoursesFilterValues]);

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
    };

    const handleViewLessons = (courseData) => {
        const course = courseData.course || courseData;
        setSelectedCourseForLessons(courseData);
        setLessonsModalVisible(true);
        fetchCourseLessons(course.id);
    };

    const handleEnroll = (courseData) => {
        // courseData might be from popular courses (with .course property) or regular course
        const course = courseData.course || courseData;
        setSelectedCourse(courseData);
        setModalVisible(true);
    };

    const handleConfirmEnroll = async () => {
        try {
            // TODO: Implement API call to enroll in course
            // const course = selectedCourse.course || selectedCourse;
            // await enrollCourseApi(course.id);
            message.success('Đăng ký khóa học thành công');
            setModalVisible(false);
            setSelectedCourse(null);
        } catch (error) {
            message.error('Không thể đăng ký khóa học');
        }
    };

    // Handlers for all courses section
    const onApplyAllCoursesFilters = () => {
        const currentFilterFormValues = allCoursesFilterForm.getFieldsValue();
        setAllCoursesFilterValues(currentFilterFormValues);
        fetchAllCourses(1, allCoursesPagination.pageSize, currentFilterFormValues);
    };

    const onClearAllCoursesFilters = () => {
        allCoursesFilterForm.resetFields();
        const clearedFilters = {
            title: null, 
            instructorName: null, 
            category: null, 
            isActive: null,
            startDateRange: null,
        };
        setAllCoursesFilterValues(clearedFilters);
        fetchAllCourses(1, allCoursesPagination.pageSize, clearedFilters);
    };

    const handleAllCoursesPaginationChange = (page, pageSize) => {
        fetchAllCourses(page, pageSize, allCoursesFilterValues);
    };

    const filteredCourses = popularCourses.filter(courseData => {
        const course = courseData.course || courseData;
        const matchesSearch = course.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchText.toLowerCase());
        const courseCategory = getCategoryName(course);
        const matchesCategory = selectedCategory === 'all' || courseCategory === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />Khóa học phổ biến nhất</h2>
                <p>Khám phá những khóa học được yêu thích và đăng ký nhiều nhất</p>
            </div>

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
                            <Option value="all">Tất cả danh mục</Option>
                            {categories.map(category => (
                                <Option key={category.id} value={category.name}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>Đang tải khóa học phổ biến...</p>
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {filteredCourses.map((courseData, index) => {
                        const course = courseData.course || courseData;
                        const enrollmentCount = courseData.enrollmentCount || 0;
                        
                        return (
                            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                                <Card
                                    hoverable
                                    style={{ height: '100%' }}
                                    cover={
                                        <div style={{ position: 'relative' }}>
                                            <img 
                                                alt={course.title} 
                                                src={getDisplayImageUrl(course.thumbnailUrl)} 
                                                style={{ height: 240, objectFit: 'cover', width: '100%' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                background: '#faad14',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                #{index + 1} Phổ biến
                                            </div>
                                        </div>
                                    }
                                    actions={[
                                        <Button
                                            type="default"
                                            icon={<EyeOutlined />}
                                            onClick={() => handleViewLessons(courseData)}
                                            style={{ marginRight: 8 }}
                                        >
                                            Xem bài học
                                        </Button>,
                                        <Button
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => handleEnroll(courseData)}
                                            disabled={!course.isActive}
                                        >
                                            {course.isActive ? 'Đăng ký' : 'Đã đóng'}
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 8 }}>
                                                    {course.title}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">{getCategoryName(course)}</Tag>
                                                    {course.isActive ? (
                                                        <Tag color="green">Đang mở</Tag>
                                                    ) : (
                                                        <Tag color="red">Đã đóng</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <p style={{ marginBottom: 8, minHeight: 40, overflow: 'hidden' }}>
                                                    {course.description}
                                                </p>
                                                {course.instructor && (
                                                    <p style={{ marginBottom: 8, color: '#666' }}>
                                                        <strong>Giảng viên:</strong> {course.instructor.firstName} {course.instructor.lastName}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div>
                                                        <p style={{ margin: 0, color: '#666' }}>
                                                            <strong>Bài học:</strong> {course.totalLessons || 0}
                                                        </p>
                                                    </div>
                                                    {course.rating && (
                                                        <div>
                                                            <Rate disabled defaultValue={course.rating} style={{ fontSize: '12px' }} />
                                                            <span style={{ fontSize: '12px', marginLeft: 4 }}>
                                                                ({course.rating}/5)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Tag color="orange" style={{ marginBottom: 4 }}>
                                                        🔥 {enrollmentCount} lượt đăng ký
                                                    </Tag>
                                                </div>
                                                {course.price && (
                                                    <p style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '16px', margin: '8px 0 0 0' }}>
                                                        {course.price.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                )}
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {filteredCourses.length === 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <p>Không tìm thấy khóa học nào phù hợp với tiêu chí tìm kiếm.</p>
                </div>
            )}

            {/* Divider between popular courses and all courses */}
            <Divider style={{ margin: '48px 0' }} />

            {/* All Courses Section */}
            <div style={{ marginBottom: 24 }}>
                <h2><AppstoreOutlined style={{ color: '#52c41a', marginRight: 8 }} />Toàn bộ khóa học</h2>
                <p>Khám phá tất cả các khóa học có sẵn trong hệ thống</p>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Form form={allCoursesFilterForm} layout="vertical" onFinish={onApplyAllCoursesFilters}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="title" label="Tên khóa học">
                                <Input placeholder="Nhập tên khóa học" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="instructorName" label="Tên giảng viên">
                                <Input placeholder="Nhập tên giảng viên" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="category" label="Danh mục">
                                <Select placeholder="Chọn danh mục" allowClear>
                                    {categories.map(cat => (
                                        <Option key={cat.id} value={cat.name}>{cat.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="isActive" label="Trạng thái">
                                <Select placeholder="Chọn trạng thái" allowClear>
                                    <Option value="all">Tất cả</Option>
                                    <Option value={true}>Đang mở</Option>
                                    <Option value={false}>Đã đóng</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <Form.Item name="startDateRange" label="Ngày bắt đầu khóa học">
                                <RangePicker style={{ width: '100%' }} placeholder={['Từ ngày', 'Đến ngày']} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <div style={{ paddingTop: '30px' }}>
                                <Space>
                                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                                        Tìm kiếm
                                    </Button>
                                    <Button onClick={onClearAllCoursesFilters} icon={<ClearOutlined />}>
                                        Xóa bộ lọc
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {allCoursesLoading ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>Đang tải toàn bộ khóa học...</p>
                </div>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {allCourses.map((course) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                                <Card
                                    hoverable
                                    style={{ height: '100%' }}
                                    cover={
                                        <div style={{ position: 'relative' }}>
                                            <img 
                                                alt={course.title} 
                                                src={getDisplayImageUrl(course.thumbnailUrl)} 
                                                style={{ height: 240, objectFit: 'cover', width: '100%' }}
                                            />
                                        </div>
                                    }
                                    actions={[
                                        <Button
                                            type="default"
                                            icon={<EyeOutlined />}
                                            onClick={() => handleViewLessons(course)}
                                            style={{ marginRight: 8 }}
                                        >
                                            Xem bài học
                                        </Button>,
                                        <Button
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => handleEnroll(course)}
                                            disabled={!course.isActive}
                                        >
                                            {course.isActive ? 'Đăng ký' : 'Đã đóng'}
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 8 }}>
                                                    {course.title}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">{getCategoryName(course)}</Tag>
                                                    {course.isActive ? (
                                                        <Tag color="green">Đang mở</Tag>
                                                    ) : (
                                                        <Tag color="red">Đã đóng</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <p style={{ marginBottom: 8, minHeight: 40, overflow: 'hidden' }}>
                                                    {course.description}
                                                </p>
                                                {course.instructor && (
                                                    <p style={{ marginBottom: 8, color: '#666' }}>
                                                        <strong>Giảng viên:</strong> {course.instructor.firstName} {course.instructor.lastName}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div>
                                                        <p style={{ margin: 0, color: '#666' }}>
                                                            <strong>Bài học:</strong> {course.totalLessons || 0}
                                                        </p>
                                                    </div>
                                                    {course.rating && (
                                                        <div>
                                                            <Rate disabled defaultValue={course.rating} style={{ fontSize: '12px' }} />
                                                            <span style={{ fontSize: '12px', marginLeft: 4 }}>
                                                                ({course.rating}/5)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {course.price && (
                                                    <p style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '16px', margin: '8px 0 0 0' }}>
                                                        {course.price.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                )}
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination for all courses */}
                    {allCoursesPagination.total > 0 && (
                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <Pagination
                                current={allCoursesPagination.current}
                                pageSize={allCoursesPagination.pageSize}
                                total={allCoursesPagination.total}
                                onChange={handleAllCoursesPaginationChange}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total, range) => 
                                    `${range[0]}-${range[1]} của ${total} khóa học`
                                }
                                pageSizeOptions={['12', '24', '36', '48']}
                            />
                        </div>
                    )}

                    {allCourses.length === 0 && !allCoursesLoading && (
                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <p>Không tìm thấy khóa học nào phù hợp với tiêu chí tìm kiếm.</p>
                        </div>
                    )}
                </>
            )}

            {/* Lessons Modal */}
            <Modal
                title={
                    <div>
                        <BookOutlined style={{ marginRight: 8 }} />
                        Danh sách bài học
                        {selectedCourseForLessons && (
                            <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginTop: 4 }}>
                                {(selectedCourseForLessons.course || selectedCourseForLessons).title}
                            </div>
                        )}
                    </div>
                }
                open={lessonsModalVisible}
                onCancel={() => {
                    setLessonsModalVisible(false);
                    setSelectedCourseForLessons(null);
                    setCourseLessons([]);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setLessonsModalVisible(false);
                        setSelectedCourseForLessons(null);
                        setCourseLessons([]);
                    }}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {loadingLessons ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16 }}>Đang tải danh sách bài học...</p>
                    </div>
                ) : (
                    <div>
                        {courseLessons.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={courseLessons}
                                renderItem={(lessonData, index) => {
                                    const lesson = lessonData.lesson || lessonData;
                                    return (
                                        <List.Item
                                            style={{ 
                                                padding: '16px',
                                                border: '1px solid #f0f0f0',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                backgroundColor: '#fafafa'
                                            }}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#1890ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {lessonData.orderIndex || index + 1}
                                                    </div>
                                                }
                                                title={
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <PlayCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                        <Title level={5} style={{ margin: 0 }}>
                                                            {lesson.title}
                                                        </Title>
                                                    </div>
                                                }
                                                description={
                                                    <div style={{ marginTop: 8 }}>
                                                        <Text type="secondary">
                                                            {lesson.description || lesson.content || 'Không có mô tả'}
                                                        </Text>
                                                        {lesson.duration && (
                                                            <div style={{ marginTop: 4 }}>
                                                                <Tag color="blue">Thời lượng: {lesson.duration} phút</Tag>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <BookOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                                <p style={{ color: '#666' }}>Khóa học này chưa có bài học nào.</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Enrollment Confirmation Modal */}
            <Modal
                title="Xác nhận đăng ký khóa học"
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
                        {(() => {
                            const course = selectedCourse.course || selectedCourse;
                            const enrollmentCount = selectedCourse.enrollmentCount || 0;
                            
                            return (
                                <div>
                                    <p>Bạn có chắc chắn muốn đăng ký khóa học:</p>
                                    <p><strong>{course.title}</strong></p>
                                    <p><strong>Danh mục:</strong> {getCategoryName(course)}</p>
                                    {course.instructor && (
                                        <p><strong>Giảng viên:</strong> {course.instructor.firstName} {course.instructor.lastName}</p>
                                    )}
                                    {enrollmentCount > 0 && (
                                        <p><strong>Số lượt đăng ký:</strong> {enrollmentCount} học viên</p>
                                    )}
                                    {course.price && (
                                        <p><strong>Giá:</strong> {course.price.toLocaleString('vi-VN')} VNĐ</p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CourseList; 
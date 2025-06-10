import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Input, Select, message, Modal, Tag, Rate, Spin, List, Typography, Pagination, Divider, Form, DatePicker, Space, Image, Avatar, Descriptions } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, TrophyOutlined, EyeOutlined, BookOutlined, PlayCircleOutlined, AppstoreOutlined, ClearOutlined, UserOutlined, ClockCircleOutlined, StarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { fetchPopularCoursesApi, fetchCategoriesApi, fetchPublicLessonsForCourseApi, fetchCoursesApi, fetchCourseByIdApi, enrollCourseApi, fetchMyEnrollmentForCourseApi } from '../../util/api';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CourseList = () => {
    const navigate = useNavigate();
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

    // New states for course preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewCourseLessons, setPreviewCourseLessons] = useState([]);

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

    // New states for enrollment management
    const [enrollmentStatuses, setEnrollmentStatuses] = useState({}); // courseId -> enrollment info
    const [enrollmentLoading, setEnrollmentLoading] = useState({}); // courseId -> loading state

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

    const fetchCoursePreview = async (courseId) => {
        setLoadingPreview(true);
        try {
            // Fetch course details and lessons simultaneously
            const [courseResponse, lessonsResponse] = await Promise.all([
                fetchCourseByIdApi(courseId),
                fetchPublicLessonsForCourseApi(courseId, { page: 0, size: 10 }) // First 10 lessons for preview
            ]);

            const courseData = courseResponse.data || courseResponse;
            const lessonsData = lessonsResponse.data || lessonsResponse;

            if (courseData.code === 1000 && courseData.result) {
                setPreviewCourse(courseData.result);
                
                if (lessonsData.code === 1000 && lessonsData.result) {
                    setPreviewCourseLessons(lessonsData.result.content || lessonsData.result);
                }
                
                setPreviewModalVisible(true);
            } else {
                message.error(courseData.message || 'Không thể tải thông tin khóa học');
            }
        } catch (error) {
            console.error('Error fetching course preview:', error);
            message.error('Không thể tải thông tin khóa học: ' + error.message);
        } finally {
            setLoadingPreview(false);
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

    // Function to check enrollment status for a course
    const checkEnrollmentStatus = async (courseId) => {
        try {
            const response = await fetchMyEnrollmentForCourseApi(courseId);
            const data = response.data || response;
            
            if (data.code === 1000 && data.result) {
                setEnrollmentStatuses(prev => ({
                    ...prev,
                    [courseId]: data.result
                }));
                return data.result;
            }
        } catch (error) {
            // If 404 or any error, means not enrolled
            setEnrollmentStatuses(prev => ({
                ...prev,
                [courseId]: null
            }));
            return null;
        }
    };

    // Function to check enrollment status for multiple courses
    const checkMultipleEnrollmentStatuses = async (courseIds) => {
        const promises = courseIds.map(courseId => checkEnrollmentStatus(courseId));
        await Promise.allSettled(promises);
    };

    useEffect(() => {
        fetchPopularCourses();
        fetchCategoriesList();
        fetchAllCourses(); // Load initial all courses
    }, []);

    // Effect to check enrollment status when popular courses are loaded
    useEffect(() => {
        if (popularCourses.length > 0) {
            const courseIds = popularCourses.map(courseData => {
                const course = courseData.course || courseData;
                return course.id;
            });
            checkMultipleEnrollmentStatuses(courseIds);
        }
    }, [popularCourses]);

    // Effect to check enrollment status when all courses are loaded
    useEffect(() => {
        if (allCourses.length > 0) {
            const courseIds = allCourses.map(course => course.id);
            checkMultipleEnrollmentStatuses(courseIds);
        }
    }, [allCourses]);

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

    const handlePreviewCourse = (courseData) => {
        const course = courseData.course || courseData;
        fetchCoursePreview(course.id);
    };

    const handleEnroll = (courseData) => {
        // courseData might be from popular courses (with .course property) or regular course
        const course = courseData.course || courseData;
        setSelectedCourse(courseData);
        setModalVisible(true);
    };

    const handleConfirmEnroll = async () => {
        const course = selectedCourse.course || selectedCourse;
        
        try {
            setEnrollmentLoading(prev => ({ ...prev, [course.id]: true }));
            
            const response = await enrollCourseApi(course.id);
            const data = response.data || response;
            
            if (data.code === 1000) {
                message.success('Đăng ký khóa học thành công');
                // Update enrollment status
                await checkEnrollmentStatus(course.id);
                setModalVisible(false);
                setSelectedCourse(null);
            } else {
                message.error(data.message || 'Không thể đăng ký khóa học');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Không thể đăng ký khóa học');
            }
        } finally {
            setEnrollmentLoading(prev => ({ ...prev, [course.id]: false }));
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

    const handleGoToLearning = (courseData) => {
        const course = courseData.course || courseData;
        navigate(`/student/course/${course.id}`);
    };

    const renderEnrollmentButton = (courseData) => {
        const course = courseData.course || courseData;
        const enrollment = enrollmentStatuses[course.id];
        const isLoading = enrollmentLoading[course.id];

        if (enrollment) {
            if (enrollment.approvalStatus === 'APPROVED') {
                return (
                    <Button
                        type="primary"
                        icon={<BookOutlined />}
                        onClick={() => handleGoToLearning(courseData)}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Vào học
                    </Button>
                );
            } else if (enrollment.approvalStatus === 'PENDING') {
                return (
                    <Button
                        type="default"
                        icon={<ClockCircleOutlined />}
                        disabled
                        style={{ color: '#faad14', borderColor: '#faad14' }}
                    >
                        Chờ duyệt
                    </Button>
                );
            } else if (enrollment.approvalStatus === 'REJECTED') {
                return (
                    <Button
                        type="default"
                        disabled
                        style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                    >
                        Bị từ chối
                    </Button>
                );
            }
        }

        // Not enrolled or enrollment status unknown
        return (
            <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleEnroll(courseData)}
                disabled={!course.isActive}
                loading={isLoading}
            >
                {course.isActive ? 'Đăng ký' : 'Đã đóng'}
            </Button>
        );
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
                                            icon={<InfoCircleOutlined />}
                                            onClick={() => handlePreviewCourse(courseData)}
                                            style={{ marginRight: 8 }}
                                            loading={loadingPreview}
                                        >
                                            Xem trước
                                        </Button>,
                                        renderEnrollmentButton(courseData)
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
                                                    {courseData.averageRating != null && (
                                                        <div>
                                                            <Rate disabled defaultValue={courseData.averageRating} style={{ fontSize: '12px' }} />
                                                            <span style={{ fontSize: '12px', marginLeft: 4 }}>
                                                                ({courseData.averageRating.toFixed(1)}/5)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        ⭐ {courseData.totalReviews != null && courseData.totalReviews > 0 ? `${courseData.totalReviews} đánh giá` : 'Chưa có đánh giá'}
                                                    </Text>
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
                                            icon={<InfoCircleOutlined />}
                                            onClick={() => handlePreviewCourse(course)}
                                            style={{ marginRight: 8 }}
                                            loading={loadingPreview}
                                        >
                                            Xem trước
                                        </Button>,
                                        renderEnrollmentButton(course)
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
                                                    {course.averageRating && (
                                                        <div>
                                                            <Rate disabled defaultValue={course.averageRating} style={{ fontSize: '12px' }} />
                                                            <span style={{ fontSize: '12px', marginLeft: 4 }}>
                                                                ({course.averageRating.toFixed(1)}/5)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        ⭐ {course.totalReviews && course.totalReviews > 0 ? `${course.totalReviews} đánh giá` : 'Chưa có đánh giá'}
                                                    </Text>
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

            {/* Course Preview Modal */}
            <Modal
                title={null}
                open={previewModalVisible}
                onCancel={() => {
                    setPreviewModalVisible(false);
                    setPreviewCourse(null);
                    setPreviewCourseLessons([]);
                }}
                footer={null}
                width={900}
                style={{ top: 20 }}
                bodyStyle={{ padding: 0 }}
            >
                {loadingPreview ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, fontSize: '16px' }}>Đang tải thông tin khóa học...</p>
                    </div>
                ) : previewCourse ? (
                    <div>
                        {/* Course Header */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '32px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Background Pattern */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.3
                            }}></div>
                            
                            <Row gutter={24} style={{ position: 'relative', zIndex: 1 }}>
                                <Col span={16}>
                                    <div>
                                        <Tag color="gold" style={{ marginBottom: 12, fontSize: '12px' }}>
                                            <StarOutlined /> {getCategoryName(previewCourse)}
                                        </Tag>
                                        <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
                                            {previewCourse.title}
                                        </Title>
                                        <p style={{ fontSize: '16px', marginBottom: 16, opacity: 0.9 }}>
                                            {previewCourse.description}
                                        </p>
                                        
                                        {/* Course Stats */}
                                        <Row gutter={24}>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {previewCourse.totalLessons || 0}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Bài học</div>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {previewCourse.averageRating ? previewCourse.averageRating.toFixed(1) : 'N/A'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Đánh giá</div>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {previewCourse.totalReviews || 0}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Học viên</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Image
                                            src={getDisplayImageUrl(previewCourse.thumbnailUrl)}
                                            alt={previewCourse.title}
                                            style={{
                                                width: '100%',
                                                maxWidth: '200px',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                border: '3px solid rgba(255,255,255,0.3)'
                                            }}
                                            fallback="https://via.placeholder.com/200x150"
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Course Content */}
                        <div style={{ padding: '32px' }}>
                            <Row gutter={32}>
                                {/* Left Column - Course Details */}
                                <Col span={14}>
                                    <div style={{ marginBottom: 32 }}>
                                        <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                                            <BookOutlined style={{ marginRight: 8 }} />
                                            Thông tin khóa học
                                        </Title>
                                        <Descriptions bordered size="small" column={1}>
                                            <Descriptions.Item label="Giảng viên">
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                                    <span>
                                                        {previewCourse.instructor ? 
                                                            `${previewCourse.instructor.firstName} ${previewCourse.instructor.lastName}` : 
                                                            'Chưa có thông tin'
                                                        }
                                                    </span>
                                                </div>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Danh mục">
                                                <Tag color="blue">{getCategoryName(previewCourse)}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Trạng thái">
                                                {previewCourse.isActive ? (
                                                    <Tag color="green">Đang mở đăng ký</Tag>
                                                ) : (
                                                    <Tag color="red">Đã đóng</Tag>
                                                )}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Đánh giá">
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {previewCourse.averageRating ? (
                                                        <>
                                                            <Rate disabled defaultValue={previewCourse.averageRating} style={{ fontSize: '14px', marginRight: 8 }} />
                                                            <span>
                                                                {previewCourse.averageRating.toFixed(1)}/5 
                                                                ({previewCourse.totalReviews || 0} đánh giá)
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>Chưa có đánh giá</span>
                                                    )}
                                                </div>
                                            </Descriptions.Item>
                                            {previewCourse.price && (
                                                <Descriptions.Item label="Học phí">
                                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5222d' }}>
                                                        {previewCourse.price.toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                </Descriptions.Item>
                                            )}
                                        </Descriptions>
                                    </div>

                                    {/* Preview Lessons */}
                                    <div>
                                        <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                                            <PlayCircleOutlined style={{ marginRight: 8 }} />
                                            Bài học mẫu
                                        </Title>
                                        {previewCourseLessons.length > 0 ? (
                                            <div>
                                                <List
                                                    size="small"
                                                    dataSource={previewCourseLessons.slice(0, 5)} // Show first 5 lessons
                                                    renderItem={(lessonData, index) => {
                                                        const lesson = lessonData.lesson || lessonData;
                                                        return (
                                                            <List.Item style={{ 
                                                                padding: '12px 16px',
                                                                border: '1px solid #f0f0f0',
                                                                borderRadius: '8px',
                                                                marginBottom: '8px',
                                                                backgroundColor: '#fafafa'
                                                            }}>
                                                                <List.Item.Meta
                                                                    avatar={
                                                                        <div style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '50%',
                                                                            backgroundColor: '#1890ff',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: 'white',
                                                                            fontSize: '12px',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {lessonData.orderIndex || index + 1}
                                                                        </div>
                                                                    }
                                                                    title={<span style={{ fontSize: '14px' }}>{lesson.title}</span>}
                                                                    description={
                                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                                            {lesson.description || 'Khám phá nội dung thú vị'}
                                                                            {lesson.duration && (
                                                                                <Tag size="small" color="blue" style={{ marginLeft: 8 }}>
                                                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                                                    {lesson.duration}p
                                                                                </Tag>
                                                                            )}
                                                                        </div>
                                                                    }
                                                                />
                                                            </List.Item>
                                                        );
                                                    }}
                                                />
                                                {previewCourseLessons.length > 5 && (
                                                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                                                        <Text type="secondary">
                                                            và {previewCourseLessons.length - 5} bài học khác...
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                <BookOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
                                                <p style={{ color: '#666' }}>Chưa có bài học mẫu</p>
                                            </div>
                                        )}
                                    </div>
                                </Col>

                                {/* Right Column - Action Panel */}
                                <Col span={10}>
                                    <div style={{ 
                                        border: '2px solid #1890ff',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        backgroundColor: '#f0f8ff',
                                        position: 'sticky',
                                        top: 20
                                    }}>
                                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                            <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>
                                                Bắt đầu học ngay!
                                            </Title>
                                            <p style={{ color: '#666', marginBottom: 0 }}>
                                                Tham gia cùng hàng nghìn học viên khác
                                            </p>
                                        </div>

                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span>✅ Truy cập trọn đời</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span>✅ Học mọi lúc, mọi nơi</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span>✅ Cộng đồng học viên</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span>✅ Hỗ trợ từ giảng viên</span>
                                            </div>
                                        </div>

                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                            <div style={{ width: '100%' }}>
                                                {(() => {
                                                    const enrollment = enrollmentStatuses[previewCourse.id];
                                                    const isLoading = enrollmentLoading[previewCourse.id];

                                                    if (enrollment) {
                                                        if (enrollment.approvalStatus === 'APPROVED') {
                                                            return (
                                                                <Button
                                                                    type="primary"
                                                                    size="large"
                                                                    icon={<BookOutlined />}
                                                                    onClick={() => {
                                                                        setPreviewModalVisible(false);
                                                                        handleGoToLearning(previewCourse);
                                                                    }}
                                                                    style={{ 
                                                                        width: '100%',
                                                                        height: '50px',
                                                                        fontSize: '16px',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: '#52c41a', 
                                                                        borderColor: '#52c41a'
                                                                    }}
                                                                >
                                                                    Vào học ngay
                                                                </Button>
                                                            );
                                                        } else if (enrollment.approvalStatus === 'PENDING') {
                                                            return (
                                                                <Button
                                                                    type="default"
                                                                    size="large"
                                                                    icon={<ClockCircleOutlined />}
                                                                    disabled
                                                                    style={{ 
                                                                        width: '100%',
                                                                        height: '50px',
                                                                        fontSize: '16px',
                                                                        fontWeight: 'bold',
                                                                        color: '#faad14', 
                                                                        borderColor: '#faad14'
                                                                    }}
                                                                >
                                                                    Đang chờ phê duyệt
                                                                </Button>
                                                            );
                                                        } else if (enrollment.approvalStatus === 'REJECTED') {
                                                            return (
                                                                <Button
                                                                    type="default"
                                                                    size="large"
                                                                    disabled
                                                                    style={{ 
                                                                        width: '100%',
                                                                        height: '50px',
                                                                        fontSize: '16px',
                                                                        fontWeight: 'bold',
                                                                        color: '#ff4d4f', 
                                                                        borderColor: '#ff4d4f'
                                                                    }}
                                                                >
                                                                    Đăng ký bị từ chối
                                                                </Button>
                                                            );
                                                        }
                                                    }

                                                    return (
                                                        <Button
                                                            type="primary"
                                                            size="large"
                                                            icon={<ShoppingCartOutlined />}
                                                            onClick={() => {
                                                                setPreviewModalVisible(false);
                                                                handleEnroll(previewCourse);
                                                            }}
                                                            disabled={!previewCourse.isActive}
                                                            loading={isLoading}
                                                            style={{ 
                                                                width: '100%',
                                                                height: '50px',
                                                                fontSize: '16px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {previewCourse.isActive ? 'Đăng ký ngay' : 'Khóa học đã đóng'}
                                                        </Button>
                                                    );
                                                })()}
                                            </div>
                                            
                                            <Button
                                                type="default"
                                                size="large"
                                                icon={<EyeOutlined />}
                                                onClick={() => {
                                                    setPreviewModalVisible(false);
                                                    handleViewLessons(previewCourse);
                                                }}
                                                style={{ width: '100%', height: '45px' }}
                                            >
                                                Xem tất cả bài học
                                            </Button>
                                        </Space>

                                        {previewCourse.price && (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                marginTop: 16,
                                                padding: '12px',
                                                backgroundColor: '#fff2e8',
                                                borderRadius: '8px',
                                                border: '1px solid #ffbb96'
                                            }}>
                                                <Text style={{ fontSize: '14px', color: '#666' }}>Chỉ với</Text>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                                                    {previewCourse.price.toLocaleString('vi-VN')} VNĐ
                                                </div>
                                                <Text style={{ fontSize: '12px', color: '#999' }}>một lần thanh toán</Text>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                ) : null}
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
                                    <p><strong>Đánh giá:</strong> {course.averageRating ? `${course.averageRating.toFixed(1)}/5 ⭐ (${course.totalReviews || 0} đánh giá)` : '⭐ Chưa có đánh giá'}</p>
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
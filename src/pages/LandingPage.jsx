import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Input, Button, Typography, Space, Card, Avatar, Rate, Tag, Carousel, Skeleton, Modal, message, Spin, List, Descriptions, Image, Divider, Pagination, Form, Select } from 'antd';
import { SearchOutlined, FacebookOutlined, GithubOutlined, InstagramOutlined, MailOutlined, PhoneOutlined, TrophyOutlined, CrownOutlined, StarOutlined, BookOutlined, TeamOutlined, UserOutlined, InfoCircleOutlined, ShoppingCartOutlined, PlayCircleOutlined, ClockCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import logo from '../assets/images/logo.png';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import axios from '../util/axios.customize';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Helper function to get full image URL (inspired by existing components)
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


const reviews = [
    {
        id: 1,
        courseName: 'ReactJS cho người mới bắt đầu',
        reviewerName: 'Minh Anh',
        reviewerAvatar: 'https://i.pravatar.cc/150?img=1',
        rating: 5,
        comment: 'Khóa học tuyệt vời! Giảng viên giải thích rất dễ hiểu và các ví dụ rất thực tế. Tôi đã tự tin hơn rất nhiều sau khi hoàn thành khóa học.',
    },
    {
        id: 2,
        courseName: 'Thiết kế UI/UX với Figma',
        reviewerName: 'Thanh Hằng',
        reviewerAvatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        comment: 'Nội dung khóa học rất chi tiết và cập nhật. Mình đã học được rất nhiều kỹ năng thiết kế hữu ích và áp dụng được ngay vào công việc.',
    },
    {
        id: 3,
        courseName: 'Machine Learning cơ bản',
        reviewerName: 'Quốc Bảo',
        reviewerAvatar: 'https://i.pravatar.cc/150?img=8',
        rating: 4,
        comment: 'Một khóa học nền tảng tốt cho những ai muốn bắt đầu với AI. Kiến thức được trình bày một cách có hệ thống. Mong có thêm các khóa học nâng cao.',
    },
];

const heroTitles = [
    'Mở Khóa Tri Thức, Dẫn Lối Tương Lai',
    'Học Tập Mọi Lúc, Mọi Nơi',
    'Phát Triển Kỹ Năng, Vững Bước Sự Nghiệp',
];

const AnimatedSection = ({ children }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

    return (
        <div
            ref={ref}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}
        >
            {children}
        </div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const [titleIndex, setTitleIndex] = useState(0);
    const [heroVisible, setHeroVisible] = useState(false);
    const [popularCourses, setPopularCourses] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [topInstructors, setTopInstructors] = useState([]);
    const [loadingTopInstructors, setLoadingTopInstructors] = useState(true);

    // New states for course preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewCourseLessons, setPreviewCourseLessons] = useState([]);

    // New states for all courses section
    const [allCourses, setAllCourses] = useState([]);
    const [loadingAllCourses, setLoadingAllCourses] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 8,
        total: 0
    });

    // New states for all instructors section
    const [allInstructors, setAllInstructors] = useState([]);
    const [loadingAllInstructors, setLoadingAllInstructors] = useState(true);
    const [instructorPagination, setInstructorPagination] = useState({
        current: 1,
        pageSize: 8,
        total: 0
    });
    const [instructorFilters, setInstructorFilters] = useState({
        name: undefined,
        experience: undefined,
        rating: undefined,
    });
    const [instructorFilterForm] = Form.useForm();

    // New states for instructor courses modal
    const [instructorCoursesModalVisible, setInstructorCoursesModalVisible] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [loadingInstructorCourses, setLoadingInstructorCourses] = useState(false);

    const fetchAllInstructors = useCallback(async (page = 1, pageSize = 8, filters = {}) => {
        setLoadingAllInstructors(true);
        try {
            const params = new URLSearchParams({
                page: page - 1,
                size: pageSize,
            });

            if (filters.name && filters.name.trim()) {
                params.append('name', filters.name.trim());
            }

            if (filters.experience) {
                const experienceMap = { '1-3': 1, '3-5': 3, '5-10': 5, '10+': 10 };
                params.append('minExperience', experienceMap[filters.experience]);
            }
            if (filters.rating) {
                const ratingMap = { '4+': 4.0, '3+': 3.0, '2+': 2.0 };
                params.append('minRating', ratingMap[filters.rating]);
            }

            const response = await axios.get(`lms/instructors/public?${params.toString()}`);
            if (response && response.result) {
                setAllInstructors(response.result.content);
                setInstructorPagination({
                    current: page,
                    pageSize: pageSize,
                    total: response.result.totalElements,
                });
            } else {
                setAllInstructors([]);
                message.error(response.message || 'Không thể tải danh sách giảng viên');
            }
        } catch (error) {
            console.error("Failed to fetch all instructors:", error);
            message.error("Không thể tải danh sách giảng viên");
        } finally {
            setLoadingAllInstructors(false);
        }
    }, []);

    useEffect(() => {
        // Initial fade-in
        const initialTimer = setTimeout(() => setHeroVisible(true), 100);

        // Set up the loop for fading text
        const intervalTimer = setInterval(() => {
            setHeroVisible(false); // Start fade-out
            setTimeout(() => {
                setTitleIndex((prevIndex) => (prevIndex + 1) % heroTitles.length);
                setHeroVisible(true); // Start fade-in with new text
            }, 800); // Wait for fade-out transition to complete (matches transition duration)
        }, 4000); // Change text every 4 seconds

        const fetchPopularCourses = async () => {
            setLoadingPopular(true);
            try {
                const response = await axios.get('lms/courses/public/popular?limit=4');
                if (response && response.result) {
                    const transformedCourses = response.result.map(item => ({
                        ...item.course,
                        enrollmentCount: item.enrollmentCount,
                        averageRating: item.averageRating,
                        totalReviews: item.totalReviews,
                    }));
                    setPopularCourses(transformedCourses);
                } else {
                    setPopularCourses([]);
                }
            } catch (error) {
                console.error("Failed to fetch popular courses:", error);
                setPopularCourses([]);
            } finally {
                setLoadingPopular(false);
            }
        };

        const fetchAllCourses = async (page = 1, pageSize = 8) => {
            setLoadingAllCourses(true);
            try {
                const response = await axios.get(`lms/courses?page=${page - 1}&size=${pageSize}&isActive=true`);
                if (response && response.result) {
                    setAllCourses(response.result.content);
                    setPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize,
                        total: response.result.totalElements
                    }));
                } else {
                    setAllCourses([]);
                    message.error(response.message || 'Không thể tải danh sách khóa học');
                }
            } catch (error) {
                console.error("Failed to fetch all courses:", error);
                message.error("Không thể tải danh sách khóa học");
            } finally {
                setLoadingAllCourses(false);
            }
        };

        const fetchTopInstructors = async () => {
            setLoadingTopInstructors(true);
            try {
                const response = await axios.get('lms/instructors/public/top?limit=4');
                if (response && response.result) {
                    setTopInstructors(response.result);
                } else {
                    setTopInstructors([]);
                }
            } catch (error) {
                console.error("Failed to fetch top instructors:", error);
                setTopInstructors([]);
            } finally {
                setLoadingTopInstructors(false);
            }
        };

        fetchPopularCourses();
        fetchAllCourses();
        fetchTopInstructors();
        fetchAllInstructors(1, 8, { name: undefined, experience: undefined, rating: undefined });

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, [fetchAllInstructors]);

    const handlePaginationChange = (page, pageSize) => {
        fetchAllCourses(page, pageSize);
    };

    const handleInstructorPaginationChange = (page, pageSize) => {
        fetchAllInstructors(page, pageSize, instructorFilters);
    };

    const onApplyInstructorFilters = (values) => {
        setInstructorFilters(values);
        fetchAllInstructors(1, instructorPagination.pageSize, values);
    };

    const onClearInstructorFilters = () => {
        instructorFilterForm.resetFields();
        const clearedFilters = { name: undefined, experience: undefined, rating: undefined };
        setInstructorFilters(clearedFilters);
        fetchAllInstructors(1, instructorPagination.pageSize, clearedFilters);
    };

    const handleViewInstructorCourses = (instructor) => {
        setSelectedInstructor(instructor);
        setInstructorCoursesModalVisible(true);
        fetchInstructorCourses(instructor.id);
    };

    const fetchInstructorCourses = async (instructorId) => {
        setLoadingInstructorCourses(true);
        try {
            const response = await axios.get(`lms/instructors/public/${instructorId}/courses`);
            if (response && response.result) {
                setInstructorCourses(response.result.content || []);
            } else {
                setInstructorCourses([]);
                message.error(response.message || 'Không thể tải khóa học của giảng viên.');
            }
        } catch (error) {
            console.error('Failed to fetch instructor courses:', error);
            setInstructorCourses([]);
            message.error('Lỗi khi tải khóa học của giảng viên.');
        } finally {
            setLoadingInstructorCourses(false);
        }
    };

    const handleRegister = () => {
        navigate('/login');
    };

    const fetchCoursePreview = async (courseId) => {
        setLoadingPreview(true);
        try {
            // Fetch course details and lessons simultaneously
            const [courseResponse, lessonsResponse] = await Promise.all([
                axios.get(`lms/courses/${courseId}`),
                axios.get(`lms/courses/${courseId}/lessons/public?page=0&size=5`) // First 5 lessons for preview
            ]);

            if (courseResponse && courseResponse.result) {
                setPreviewCourse(courseResponse.result);
                if (lessonsResponse && lessonsResponse.result) {
                    setPreviewCourseLessons(lessonsResponse.result.content || lessonsResponse.result);
                }
                setPreviewModalVisible(true);
            } else {
                message.error(courseResponse.message || 'Không thể tải thông tin khóa học');
            }
        } catch (error) {
            console.error('Error fetching course preview:', error);
            message.error('Không thể tải thông tin khóa học: ' + error.message);
        } finally {
            setLoadingPreview(false);
        }
    };


    const handlePreviewCourse = (course) => {
        fetchCoursePreview(course.id);
    };

    const getCategoryName = (course) => {
        return course?.category?.name || 'Chưa phân loại';
    }

    return (
        <Layout style={{ backgroundColor: '#ffffff' }}>
            {/* Sticky Header */}
            <Header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'saturate(180%) blur(5px)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 50px',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                    <Col>
                        <img src={logo} alt="Innolearn Logo" style={{ height: '40px', cursor: 'pointer' }} onClick={() => navigate('/')} />
                    </Col>
                    <Col flex="auto" style={{ textAlign: 'center', padding: '0 50px' }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm khóa học bạn quan tâm..."
                            size="large"
                            style={{ maxWidth: 500, borderRadius: '20px' }}
                        />
                    </Col>
                    <Col>
                        <Space size="middle">
                            <Button size="large" onClick={() => navigate('/login')}>Đăng nhập</Button>
                            <Button type="primary" size="large" onClick={() => navigate('/register')}>Đăng ký</Button>
                        </Space>
                    </Col>
                </Row>
            </Header>

            <Content>
                {/* Hero Section */}
                <div style={{
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    padding: '0 50px',
                    textAlign: 'center'
                }}>
                    <div style={{ maxWidth: 800 }}>
                        <Title
                            level={1}
                            style={{
                                fontSize: '4.5rem',
                                fontWeight: 900,
                                marginBottom: '20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '180px', // To prevent layout shifts
                                opacity: heroVisible ? 1 : 0,
                                transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
                            }}
                        >
                            {heroTitles[titleIndex]}
                        </Title>
                        <Paragraph style={{ fontSize: '1.2rem', color: '#555', marginBottom: 30 }}>
                            Innolearn là nền tảng học tập trực tuyến hàng đầu, nơi bạn có thể khám phá hàng ngàn khóa học chất lượng từ các chuyên gia đầu ngành. Hãy bắt đầu hành trình chinh phục kiến thức của bạn ngay hôm nay!
                        </Paragraph>
                        <Button type="primary" size="large" style={{ height: 50, padding: '0 40px', fontSize: '1.1rem' }}>
                            Khám phá khóa học
                        </Button>
                    </div>
                </div>

                {/* Popular Courses Section */}
                <div style={{ padding: '80px 50px', backgroundColor: '#fff' }}>
                    <AnimatedSection>
                        <div style={{ textAlign: 'center', marginBottom: 50 }}>
                            <Title level={2}><TrophyOutlined style={{ color: '#faad14', marginRight: 12 }} />Khóa học phổ biến nhất</Title>
                            <Paragraph type="secondary">Những khóa học được cộng đồng Innolearn yêu thích và đánh giá cao nhất.</Paragraph>
                        </div>
                        <Row gutter={[24, 24]}>
                            {loadingPopular ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                        <Card style={{ height: '100%' }}>
                                            <Skeleton active />
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                popularCourses.map((course, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                                        <Card
                                            hoverable
                                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                            cover={
                                                <div style={{ position: 'relative' }}>
                                                    <img
                                                        alt={course.title}
                                                        src={getDisplayImageUrl(course.thumbnailUrl)}
                                                        style={{ height: 200, objectFit: 'cover', width: '100%' }}
                                                    />
                                                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#faad14', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        #{index + 1} Phổ biến
                                                    </div>
                                                </div>
                                            }
                                            actions={[
                                                <Button
                                                    type="default"
                                                    icon={<InfoCircleOutlined />}
                                                    onClick={() => handlePreviewCourse(course)}
                                                    loading={loadingPreview && previewCourse?.id === course.id}
                                                >
                                                    Xem chi tiết
                                                </Button>,
                                                <Button
                                                    type="primary"
                                                    icon={<ShoppingCartOutlined />}
                                                    onClick={handleRegister}
                                                >
                                                    Đăng ký
                                                </Button>
                                            ]}
                                        >
                                            <Card.Meta
                                                title={<div style={{ fontSize: '16px', fontWeight: 'bold', minHeight: '48px' }}>{course.title}</div>}
                                                description={
                                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Tag color="blue">{course.category.name}</Tag>
                                                            {course.isActive ? <Tag color="green">Đang mở</Tag> : <Tag color="red">Đã đóng</Tag>}
                                                        </div>
                                                        <p style={{ color: '#666' }}>
                                                            <strong>GV:</strong> {course.instructor.firstName} {course.instructor.lastName}
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Text type="secondary"><BookOutlined /> {course.totalLessons} bài học</Text>
                                                            <div>
                                                                <Rate disabled value={course.averageRating || 0} style={{ fontSize: '14px' }} />
                                                                {course.averageRating != null && (
                                                                    <span style={{ fontSize: '12px', marginLeft: 4 }}>({course.averageRating.toFixed(1)})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 8 }}>
                                                            <Tag color="orange">🔥 {course.enrollmentCount} lượt đăng ký</Tag>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </Card>
                                    </Col>
                                ))
                            )}
                        </Row>
                    </AnimatedSection>
                </div>

                <Divider />

                {/* All Courses Section */}
                <div id="all-courses" style={{ padding: '80px 50px', backgroundColor: '#f9f9f9' }}>
                    <AnimatedSection>
                        <div style={{ textAlign: 'center', marginBottom: 50 }}>
                            <Title level={2}><AppstoreOutlined style={{ color: '#1890ff', marginRight: 12 }} />Tất cả khóa học</Title>
                            <Paragraph type="secondary">Khám phá toàn bộ khoá học đa dạng và phong phú tại Innolearn.</Paragraph>
                        </div>
                        <Row gutter={[24, 24]}>
                            {loadingAllCourses ? (
                                Array.from({ length: 8 }).map((_, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                        <Card style={{ height: '100%' }}>
                                            <Skeleton active />
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                allCourses.map((course) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                                        <Card
                                            hoverable
                                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                            cover={
                                                <img
                                                    alt={course.title}
                                                    src={getDisplayImageUrl(course.thumbnailUrl)}
                                                    style={{ height: 200, objectFit: 'cover', width: '100%' }}
                                                />
                                            }
                                            actions={[
                                                <Button
                                                    type="default"
                                                    icon={<InfoCircleOutlined />}
                                                    onClick={() => handlePreviewCourse(course)}
                                                    loading={loadingPreview && previewCourse?.id === course.id}
                                                >
                                                    Xem chi tiết
                                                </Button>,
                                                <Button
                                                    type="primary"
                                                    icon={<ShoppingCartOutlined />}
                                                    onClick={handleRegister}
                                                >
                                                    Đăng ký
                                                </Button>
                                            ]}
                                        >
                                            <Card.Meta
                                                title={<div style={{ fontSize: '16px', fontWeight: 'bold', minHeight: '48px' }}>{course.title}</div>}
                                                description={
                                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Tag color="blue">{getCategoryName(course)}</Tag>
                                                            {course.isActive ? <Tag color="green">Đang mở</Tag> : <Tag color="red">Đã đóng</Tag>}
                                                        </div>
                                                        <p style={{ color: '#666' }}>
                                                            <strong>GV:</strong> {course.instructor.firstName} {course.instructor.lastName}
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Text type="secondary"><BookOutlined /> {course.totalLessons} bài học</Text>
                                                            <div>
                                                                <Rate disabled value={course.averageRating || 0} style={{ fontSize: '14px' }} />
                                                                {course.averageRating != null && (
                                                                    <span style={{ fontSize: '12px', marginLeft: 4 }}>({course.averageRating.toFixed(1)})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 8 }}>
                                                            <Tag color="purple">⭐ {course.totalReviews} đánh giá</Tag>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </Card>
                                    </Col>
                                ))
                            )}
                        </Row>
                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                onChange={handlePaginationChange}
                                showSizeChanger
                                pageSizeOptions={['8', '12', '16', '20']}
                            />
                        </div>
                    </AnimatedSection>
                </div>

                {/* Top Instructors Section */}
                <div style={{ padding: '80px 50px', backgroundColor: '#f0f2f5' }}>
                    <AnimatedSection>
                        <div style={{ textAlign: 'center', marginBottom: 50 }}>
                            <Title level={2}><CrownOutlined style={{ color: '#faad14', marginRight: 12 }} />Giảng viên hàng đầu</Title>
                            <Paragraph type="secondary">Học hỏi từ những chuyên gia xuất sắc nhất trong ngành.</Paragraph>
                        </div>
                        <Row gutter={[24, 24]}>
                            {loadingTopInstructors ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                        <Card style={{ height: '100%' }}>
                                            <Skeleton avatar active />
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                topInstructors.map((instructor) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={instructor.id}>
                                        <Card hoverable style={{ height: '100%', textAlign: 'center' }}>
                                            <Avatar size={100} src={getDisplayImageUrl(instructor.avatarUrl)} icon={<UserOutlined />} style={{ border: '4px solid #1890ff', marginBottom: 16 }} />
                                            <Title level={4}>{instructor.firstName} {instructor.lastName}</Title>
                                            <Paragraph type="secondary" style={{ minHeight: 40 }}>{instructor.bio}</Paragraph>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                                <Rate disabled value={instructor.averageRating || 0} style={{ fontSize: '14px' }} />
                                                {instructor.averageRating != null && (
                                                    <span style={{ marginLeft: 8 }}>{instructor.averageRating.toFixed(1)}/5 ({instructor.totalReviews} đánh giá)</span>
                                                )}
                                            </div>
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Row style={{ width: '100%' }}>
                                                    <Col span={12}><Text strong><TeamOutlined /> {instructor.totalStudents}</Text></Col>
                                                    <Col span={12}><Text strong><BookOutlined /> {instructor.totalCourses}</Text></Col>
                                                </Row>
                                                {instructor.experienceYears && <Tag color="blue">{instructor.experienceYears} năm kinh nghiệm</Tag>}
                                            </Space>
                                        </Card>
                                    </Col>
                                ))
                            )}
                        </Row>
                    </AnimatedSection>
                </div>

                {/* All Instructors Section */}
                <div id="all-instructors" style={{ padding: '80px 50px', backgroundColor: '#fff' }}>
                    <AnimatedSection>
                        <div style={{ textAlign: 'center', marginBottom: 50 }}>
                            <Title level={2}><TeamOutlined style={{ color: '#1890ff', marginRight: 12 }} />Tất cả giảng viên</Title>
                            <Paragraph type="secondary">Gặp gỡ đội ngũ giảng viên chuyên nghiệp và đầy nhiệt huyết của chúng tôi.</Paragraph>
                        </div>
                        <Card style={{ marginBottom: 32 }}>
                            <Form form={instructorFilterForm} layout="vertical" onFinish={onApplyInstructorFilters}>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item name="name" label="Tên giảng viên">
                                            <Input placeholder="Nhập tên giảng viên" allowClear />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item name="experience" label="Kinh nghiệm">
                                            <Select placeholder="Chọn mức kinh nghiệm" allowClear>
                                                <Option value="1-3">1-3 năm</Option>
                                                <Option value="3-5">3-5 năm</Option>
                                                <Option value="5-10">5-10 năm</Option>
                                                <Option value="10+">Hơn 10 năm</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item name="rating" label="Đánh giá">
                                            <Select placeholder="Chọn mức đánh giá" allowClear>
                                                <Option value="4+">4+ sao</Option>
                                                <Option value="3+">3+ sao</Option>
                                                <Option value="2+">2+ sao</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={24} style={{ textAlign: 'right' }}>
                                        <Space>
                                            <Button onClick={onClearInstructorFilters}>
                                                Xóa bộ lọc
                                            </Button>
                                            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                                                Tìm kiếm
                                            </Button>
                                        </Space>
                                    </Col>
                                </Row>
                            </Form>
                        </Card>
                        <Row gutter={[24, 24]}>
                            {loadingAllInstructors ? (
                                Array.from({ length: 8 }).map((_, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                        <Card style={{ height: '100%' }}><Skeleton avatar active /></Card>
                                    </Col>
                                ))
                            ) : allInstructors.length > 0 ? (
                                allInstructors.map((instructor) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={instructor.id}>
                                        <Card hoverable style={{ height: '100%', textAlign: 'center' }}>
                                            <Avatar size={100} src={getDisplayImageUrl(instructor.avatarUrl)} icon={<UserOutlined />} style={{ border: '4px solid #1890ff', marginBottom: 16 }} />
                                            <Title level={4}>{instructor.firstName} {instructor.lastName}</Title>
                                            <Paragraph type="secondary" style={{ minHeight: 40 }} ellipsis={{ rows: 2, expandable: false }}>{instructor.bio || 'Chưa có tiểu sử.'}</Paragraph>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                                <Rate disabled allowHalf value={instructor.averageRating || 0} style={{ fontSize: '14px' }} />
                                                <span style={{ marginLeft: 8 }}>({instructor.totalReviews || 0} đánh giá)</span>
                                            </div>
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Row style={{ width: '100%' }}>
                                                    <Col span={12}><Text strong><TeamOutlined /> {instructor.totalStudents || 0}</Text></Col>
                                                    <Col span={12}><Text strong><BookOutlined /> {instructor.totalCourses || 0}</Text></Col>
                                                </Row>
                                                {instructor.experienceYears != null && <Tag color="blue">{instructor.experienceYears} năm kinh nghiệm</Tag>}
                                                <Button
                                                    type="default"
                                                    icon={<BookOutlined />}
                                                    onClick={() => handleViewInstructorCourses(instructor)}
                                                    style={{ width: '100%', marginTop: 8 }}
                                                >
                                                    Xem khóa học
                                                </Button>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col span={24} style={{ textAlign: 'center' }}>
                                    <Paragraph>Không tìm thấy giảng viên nào phù hợp.</Paragraph>
                                </Col>
                            )}
                        </Row>
                        {allInstructors.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 32 }}>
                                <Pagination
                                    current={instructorPagination.current}
                                    pageSize={instructorPagination.pageSize}
                                    total={instructorPagination.total}
                                    onChange={handleInstructorPaginationChange}
                                    showSizeChanger
                                    pageSizeOptions={['8', '12', '16', '20']}
                                />
                            </div>
                        )}
                    </AnimatedSection>
                </div>

                {/* Reviews Section */}
                <div style={{ padding: '80px 50px', backgroundColor: '#fff' }}>
                    <AnimatedSection>
                        <div style={{ textAlign: 'center', marginBottom: 50 }}>
                            <Title level={2}><StarOutlined style={{ color: '#faad14', marginRight: 12 }} />Học viên nói gì về Innolearn</Title>
                            <Paragraph type="secondary">Những chia sẻ và cảm nhận thực tế từ các học viên của chúng tôi.</Paragraph>
                        </div>
                        <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ paddingBottom: '40px' }}>
                            {reviews.map((review) => (
                                <div key={review.id} style={{ padding: '0 20px' }}>
                                    <Card style={{
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '24px',
                                        backgroundColor: '#fafafa'
                                    }}>
                                        <Card.Meta
                                            avatar={<Avatar size={64} src={review.reviewerAvatar} />}
                                            title={<Title level={5} style={{ marginBottom: 0 }}>{review.reviewerName}</Title>}
                                            description={<Text type="secondary">Học viên khóa "{review.courseName}"</Text>}
                                        />
                                        <Rate disabled defaultValue={review.rating} style={{ margin: '16px 0' }} />
                                        <Paragraph style={{ fontStyle: 'italic', color: '#555', minHeight: 80 }}>
                                            "{review.comment}"
                                        </Paragraph>
                                    </Card>
                                </div>
                            ))}
                        </Carousel>
                    </AnimatedSection>
                </div>
            </Content>

            {/* Footer */}
            <Footer style={{ backgroundColor: '#001529', color: 'rgba(255, 255, 255, 0.65)', padding: '60px 50px' }}>
                <Row gutter={[48, 48]} justify="space-between">
                    <Col xs={24} sm={12} md={8}>
                        <img src={logo} alt="Innolearn Logo" style={{ height: '50px', marginBottom: '20px' }} />
                        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                            Nền tảng học tập trực tuyến, giúp bạn tiếp cận kiến thức mọi lúc mọi nơi và phát triển sự nghiệp.
                        </Paragraph>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Title level={4} style={{ color: '#fff' }}>Liên hệ</Title>
                        <Space direction="vertical" size="middle">
                            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}><MailOutlined style={{ marginRight: 8 }} /> innolearn-edu@gmail.com</Text>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}><PhoneOutlined style={{ marginRight: 8 }} /> 0123456789</Text>
                        </Space>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Title level={4} style={{ color: '#fff' }}>Kết nối với chúng tôi</Title>
                        <Space size="large">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <Avatar size="large" icon={<FacebookOutlined />} style={{ backgroundColor: '#1877F2' }} />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                <Avatar size="large" icon={<GithubOutlined />} style={{ backgroundColor: '#333' }} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <Avatar size="large" icon={<InstagramOutlined />} style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }} />
                            </a>
                        </Space>
                    </Col>
                </Row>
                <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                        © 2025 Innolearn. All rights reserved.
                    </Text>
                </div>
            </Footer>

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
                                                    <Avatar icon={<UserOutlined />} src={getDisplayImageUrl(previewCourse.instructor?.avatarUrl)} style={{ marginRight: 8 }} />
                                                    <span>
                                                        {previewCourse.instructor ? 
                                                            `${previewCourse.instructor.firstName} ${previewCourse.instructor.lastName}` : 
                                                            'Chưa có thông tin'
                                                        }
                                                    </span>
                                                </div>
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
                                                            <Rate disabled value={previewCourse.averageRating} style={{ fontSize: '14px', marginRight: 8 }} />
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
                                        </Descriptions>
                                    </div>

                                    {/* Preview Lessons */}
                                    <div>
                                        <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                                            <PlayCircleOutlined style={{ marginRight: 8 }} />
                                            Bài học mẫu
                                        </Title>
                                        {loadingPreview ? <Spin /> : previewCourseLessons.length > 0 ? (
                                            <List
                                                size="small"
                                                dataSource={previewCourseLessons}
                                                renderItem={(lessonData, index) => {
                                                    const lesson = lessonData.lesson || lessonData;
                                                    return (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                avatar={<Avatar size="small" style={{ background: '#1890ff' }}>{index+1}</Avatar>}
                                                                title={lesson.title}
                                                                description={lesson.description}
                                                            />
                                                        </List.Item>
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <p>Chưa có bài học mẫu.</p>
                                        )}
                                    </div>
                                </Col>

                                {/* Right Column - Action Panel */}
                                <Col span={10}>
                                    <div style={{ 
                                        border: '1px solid #e8e8e8',
                                        borderRadius: '8px',
                                        padding: '24px',
                                        backgroundColor: '#fafafa',
                                        position: 'sticky',
                                        top: 20
                                    }}>
                                        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Bắt đầu ngay</Title>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={handleRegister}
                                            style={{ width: '100%', height: 50, fontSize: '18px' }}
                                        >
                                            Đăng ký học
                                        </Button>
                                        <p style={{textAlign: 'center', marginTop: '1rem', color: '#8c8c8c'}}>Truy cập trọn đời khóa học.</p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <Modal
                title={`Các khóa học của ${selectedInstructor?.firstName || ''} ${selectedInstructor?.lastName || ''}`}
                open={instructorCoursesModalVisible}
                onCancel={() => {
                    setInstructorCoursesModalVisible(false);
                    setSelectedInstructor(null);
                    setInstructorCourses([]);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setInstructorCoursesModalVisible(false);
                        setSelectedInstructor(null);
                        setInstructorCourses([]);
                    }}>
                        Đóng
                    </Button>
                ]}
                width={800}
                destroyOnClose
            >
                {loadingInstructorCourses ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : instructorCourses.length > 0 ? (
                    <List
                        itemLayout="vertical"
                        dataSource={instructorCourses}
                        renderItem={course => (
                            <List.Item
                                key={course.id}
                                extra={
                                    <img
                                        width={150}
                                        alt={course.title}
                                        src={getDisplayImageUrl(course.thumbnailUrl)}
                                        style={{ objectFit: 'cover', borderRadius: '8px', height: 100 }}
                                    />
                                }
                            >
                                <List.Item.Meta
                                    title={<a onClick={() => handlePreviewCourse(course)}>{course.title}</a>}
                                    description={<Paragraph ellipsis={{ rows: 2 }}>{course.description}</Paragraph>}
                                />
                                <Space size="middle">
                                    <Text type="secondary"><BookOutlined /> {course.totalLessons} bài học</Text>
                                    {course.averageRating != null ? (
                                        <Space>
                                            <Rate disabled allowHalf value={course.averageRating} style={{ fontSize: 14 }} />
                                            <span>({course.averageRating.toFixed(1)})</span>
                                        </Space>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 14 }}>Chưa có đánh giá</Text>
                                    )}
                                </Space>
                            </List.Item>
                        )}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <BookOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        <Title level={5} style={{ marginTop: 16 }}>Giảng viên này chưa có khóa học nào</Title>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default LandingPage; 
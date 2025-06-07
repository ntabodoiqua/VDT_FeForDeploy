import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, 
    Image, 
    Typography, 
    Space, 
    Collapse, 
    Button, 
    Empty, 
    Spin, 
    message, 
    Tag, 
    Divider,
    Row,
    Col,
    Avatar,
    List
} from 'antd';
import { 
    ArrowLeftOutlined, 
    BookOutlined, 
    UserOutlined, 
    ClockCircleOutlined,
    PlayCircleOutlined,
    CalendarOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchCourseByIdApi, fetchLessonsForCourseApi } from '../../util/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const StudentCourseView = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lessonsLoading, setLessonsLoading] = useState(false);

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null;

        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }

        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        
        return urlPath; 
    };

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await fetchCourseByIdApi(courseId);
            if (response.code === 1000 && response.result) {
                setCourse(response.result);
                await fetchCourseLessons();
            } else {
                message.error(response.message || 'Không thể tải thông tin khóa học');
            }
        } catch (error) {
            message.error('Không thể tải thông tin khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseLessons = async () => {
        setLessonsLoading(true);
        try {
            const response = await fetchLessonsForCourseApi(courseId, { page: 0, size: 1000 });
            if (response.code === 1000 && response.result) {
                // Xử lý dữ liệu trả về - có thể là array trực tiếp hoặc object có content
                let lessonsData = response.result;
                
                // Nếu response.result là object có content (pagination)
                if (lessonsData.content && Array.isArray(lessonsData.content)) {
                    lessonsData = lessonsData.content;
                }
                
                // Nếu lessonsData là array
                if (Array.isArray(lessonsData)) {
                    // Sắp xếp bài học theo thứ tự
                    const sortedLessons = lessonsData.sort((a, b) => {
                        return (a.displayOrder || 0) - (b.displayOrder || 0);
                    });
                    setLessons(sortedLessons);
                } else {
                    console.warn('Unexpected lessons data structure:', lessonsData);
                    setLessons([]);
                }
            } else {
                message.error(response.message || 'Không thể tải danh sách bài học');
                setLessons([]);
            }
        } catch (error) {
            console.error('Error fetching course lessons:', error);
            message.error('Không thể tải danh sách bài học: ' + error.message);
            setLessons([]);
        } finally {
            setLessonsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleLessonClick = (lesson) => {
        // lesson từ API courses/{courseId}/lessons là CourseLesson object
        // Cần truy cập lesson.lesson.id để lấy ID thực của lesson
        const lessonId = lesson.lesson?.id || lesson.lessonId || lesson.id;
        console.log('Lesson click - Full lesson object:', lesson);
        console.log('Lesson click - Using lessonId:', lessonId);
        navigate(`/instructor/student-lesson-view/${lessonId}`);
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ padding: '40px' }}>
                <Empty 
                    description="Không tìm thấy thông tin khóa học"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={handleBack}>
                        Quay lại
                    </Button>
                </Empty>
            </div>
        );
    }

    const courseImageUrl = getDisplayImageUrl(course.thumbnailUrl);

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header với nút quay lại */}
            <div style={{ marginBottom: '24px' }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBack}
                    style={{ marginBottom: '16px' }}
                >
                    Quay lại
                </Button>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    Xem khóa học dành cho học viên
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                {/* Cột trái - Thông tin chính */}
                <Col xs={24} lg={16}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        {/* Header khóa học */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            {courseImageUrl && (
                                <Image
                                    src={courseImageUrl}
                                    alt={course.title}
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        height: '250px',
                                        objectFit: 'cover',
                                        borderRadius: '12px',
                                        marginBottom: '24px'
                                    }}
                                />
                            )}
                            
                            <Title level={1} style={{ 
                                fontSize: '32px', 
                                fontWeight: 'bold',
                                color: '#1890ff',
                                marginBottom: '8px'
                            }}>
                                {course.title}
                            </Title>

                            {course.description && (
                                <Paragraph 
                                    style={{ 
                                        fontSize: '16px', 
                                        color: '#666',
                                        textAlign: 'left',
                                        marginTop: '24px'
                                    }}
                                >
                                    {course.description}
                                </Paragraph>
                            )}
                        </div>

                        <Divider />

                        {/* Thông tin khóa học */}
                        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                            <Col xs={24} sm={12}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar 
                                            icon={<UserOutlined />} 
                                            style={{ backgroundColor: '#1890ff' }} 
                                        />
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Giảng viên</Text>
                                            <Text style={{ color: '#666' }}>
                                                {course.instructor ? 
                                                    `${course.instructor.firstName} ${course.instructor.lastName}` : 
                                                    'Chưa cập nhật'
                                                }
                                            </Text>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar 
                                            icon={<BookOutlined />} 
                                            style={{ backgroundColor: '#52c41a' }} 
                                        />
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Số bài học</Text>
                                            <Text style={{ color: '#666' }}>
                                                {lessons.length} bài học
                                            </Text>
                                        </div>
                                    </div>
                                </Space>
                            </Col>
                            
                            <Col xs={24} sm={12}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar 
                                            icon={<ClockCircleOutlined />} 
                                            style={{ backgroundColor: '#faad14' }} 
                                        />
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Cập nhật lần cuối</Text>
                                            <Text style={{ color: '#666' }}>
                                                {course.updatedAt ? 
                                                    dayjs(course.updatedAt).format('DD/MM/YYYY HH:mm') : 
                                                    'Chưa cập nhật'
                                                }
                                            </Text>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar 
                                            icon={<CalendarOutlined />} 
                                            style={{ backgroundColor: '#722ed1' }} 
                                        />
                                        <div>
                                            <Text strong style={{ display: 'block' }}>Trạng thái</Text>
                                            <Tag color={course.isActive ? 'green' : 'red'}>
                                                {course.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                            </Tag>
                                        </div>
                                    </div>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Cột phải - Danh sách bài học */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <Space>
                                <BookOutlined style={{ color: '#1890ff' }} />
                                <span>Danh sách bài học</span>
                            </Space>
                        }
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        {lessonsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spin />
                            </div>
                        ) : lessons.length === 0 ? (
                            <Empty 
                                description="Chưa có bài học nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <Collapse
                                ghost
                                defaultActiveKey={['1']}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <Panel 
                                    header={
                                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                            Tất cả bài học ({lessons.length})
                                        </span>
                                    } 
                                    key="1"
                                >
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={lessons}
                                        renderItem={(lesson, index) => (
                                            <List.Item
                                                style={{
                                                    padding: '12px 16px',
                                                    margin: '8px 0',
                                                    backgroundColor: '#fafafa',
                                                    borderRadius: '8px',
                                                    border: '1px solid #f0f0f0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#e6f7ff';
                                                    e.currentTarget.style.borderColor = '#1890ff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fafafa';
                                                    e.currentTarget.style.borderColor = '#f0f0f0';
                                                }}
                                                onClick={() => handleLessonClick(lesson)}
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar 
                                                            icon={<PlayCircleOutlined />}
                                                            style={{ 
                                                                backgroundColor: '#1890ff',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </Avatar>
                                                    }
                                                    title={
                                                        <Text 
                                                            strong 
                                                            style={{ 
                                                                fontSize: '14px',
                                                                color: '#1890ff'
                                                            }}
                                                        >
                                                            {lesson.lesson?.title || lesson.title || 'Chưa có tiêu đề'}
                                                        </Text>
                                                    }
                                                    description={
                                                        <Text 
                                                            style={{ 
                                                                fontSize: '12px',
                                                                color: '#666'
                                                            }}
                                                        >
                                                            {lesson.lesson?.description || lesson.description || 'Không có mô tả'}
                                                        </Text>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Panel>
                            </Collapse>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StudentCourseView; 
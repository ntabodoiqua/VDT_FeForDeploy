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
    CalendarOutlined,
    FileTextOutlined,
    DownloadOutlined,
    FilePdfOutlined,
    PictureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchCourseByIdApi, fetchLessonsForCourseApi, fetchCourseDocumentsApi, downloadCourseDocumentApi } from '../../util/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const StudentCourseView = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [documentsLoading, setDocumentsLoading] = useState(false);

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

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <PictureOutlined style={{ color: '#52c41a' }} />;
            case 'doc':
            case 'docx':
                return <FileTextOutlined style={{ color: '#1890ff' }} />;
            case 'xls':
            case 'xlsx':
                return <FileTextOutlined style={{ color: '#52c41a' }} />;
            case 'ppt':
            case 'pptx':
                return <FileTextOutlined style={{ color: '#faad14' }} />;
            default:
                return <FileTextOutlined style={{ color: '#666' }} />;
        }
    };

    const getOriginalFileName = (fileName) => {
        if (!fileName) return fileName;
        
        // Loại bỏ UUID prefix (format: UUID_originalname.ext)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
        return fileName.replace(uuidPattern, '');
    };

    const truncateFileName = (fileName, maxLength = 40) => {
        const originalName = getOriginalFileName(fileName);
        
        if (!originalName || originalName.length <= maxLength) {
            return originalName;
        }
        
        const extension = originalName.split('.').pop();
        const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));
        
        if (nameWithoutExtension.length <= maxLength - extension.length - 4) {
            return originalName;
        }
        
        const truncatedName = nameWithoutExtension.substring(0, maxLength - extension.length - 4);
        return `${truncatedName}...${extension}`;
    };

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await fetchCourseByIdApi(courseId);
            if (response.code === 1000 && response.result) {
                setCourse(response.result);
                await fetchCourseLessons();
                await fetchCourseDocuments();
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

    const fetchCourseDocuments = async () => {
        setDocumentsLoading(true);
        try {
            const response = await fetchCourseDocumentsApi(courseId);
            if (response.code === 1000 && response.result) {
                setDocuments(response.result);
            } else {
                // Không hiển thị lỗi nếu không có tài liệu, chỉ set empty array
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching course documents:', error);
            // Không hiển thị lỗi, chỉ log để debug
            setDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    };

    const handleDocumentDownload = async (document) => {
        try {
            const response = await downloadCourseDocumentApi(courseId, document.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', document.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Tải xuống thành công');
        } catch (error) {
            console.error('Error downloading document:', error);
            message.error('Không thể tải xuống tài liệu');
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
                <Col xs={24} lg={12}>
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

                {/* Cột phải - Tài liệu và Bài học */}
                <Col xs={24} lg={12}>
                    <Row gutter={[0, 24]}>
                        {/* Card Tài liệu liên quan */}
                        <Col xs={24}>
                            <Card
                                title={
                                    <Space>
                                        <FileTextOutlined style={{ color: '#1890ff' }} />
                                        <span>Tài liệu liên quan</span>
                                    </Space>
                                }
                                style={{
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                {documentsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <Spin />
                                    </div>
                                ) : documents.length === 0 ? (
                                    <Empty 
                                        description="Chưa có tài liệu nào"
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
                                                    Tất cả tài liệu ({documents.length})
                                                </span>
                                            } 
                                            key="1"
                                        >
                                            <List
                                                itemLayout="horizontal"
                                                dataSource={documents}
                                                renderItem={(document) => (
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
                                                        onClick={() => handleDocumentDownload(document)}
                                                        actions={[
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<DownloadOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDocumentDownload(document);
                                                                }}
                                                                style={{ color: '#1890ff' }}
                                                            />
                                                        ]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={getFileIcon(document.fileName || document.originalFileName)}
                                                            title={
                                                                <div>
                                                                    <Text 
                                                                        strong 
                                                                        style={{ 
                                                                            fontSize: '14px',
                                                                            color: '#1890ff',
                                                                            wordBreak: 'break-word',
                                                                            display: 'block'
                                                                        }}
                                                                    >
                                                                        {document.title || 'Tài liệu không có tiêu đề'}
                                                                    </Text>
                                                                    <Text 
                                                                        style={{ 
                                                                            fontSize: '11px',
                                                                            color: '#999',
                                                                            wordBreak: 'break-word'
                                                                        }}
                                                                    >
                                                                        File: {truncateFileName(document.fileName || document.originalFileName)}
                                                                    </Text>
                                                                </div>
                                                            }
                                                            description={
                                                                <div>
                                                                    {document.description && (
                                                                        <Text 
                                                                            style={{ 
                                                                                fontSize: '12px',
                                                                                color: '#666',
                                                                                display: 'block',
                                                                                marginBottom: '4px'
                                                                            }}
                                                                        >
                                                                            {document.description}
                                                                        </Text>
                                                                    )}
                                                                    <Text 
                                                                        style={{ 
                                                                            fontSize: '11px',
                                                                            color: '#999'
                                                                        }}
                                                                    >
                                                                        Kích thước: {document.fileSize ? 
                                                                            `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                                                                            'Không rõ'
                                                                        }
                                                                    </Text>
                                                                </div>
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

                        {/* Card Danh sách bài học */}
                        <Col xs={24}>
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
                </Col>
            </Row>
        </div>
    );
};

export default StudentCourseView; 
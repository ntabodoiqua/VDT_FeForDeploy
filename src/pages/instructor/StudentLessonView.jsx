import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, 
    Typography, 
    Space, 
    Button, 
    Empty, 
    Spin, 
    message, 
    Divider,
    Row,
    Col,
    Avatar,
    List,
    Image,
    Tag
} from 'antd';
import { 
    ArrowLeftOutlined, 
    UserOutlined, 
    ClockCircleOutlined,
    FileTextOutlined,
    DownloadOutlined,
    LinkOutlined,
    FilePdfOutlined,
    PlayCircleOutlined,
    PictureOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { fetchLessonByIdApi, fetchLessonDocumentsApi, downloadLessonDocumentApi } from '../../util/api';

const { Title, Text, Paragraph } = Typography;

const LessonContentRenderer = ({ content }) => {
    const contentRef = useRef(null);

    useEffect(() => {
        const element = contentRef.current;
        if (element) {
            try {
                renderMathInElement(element, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error("KaTeX rendering error:", error);
            }
        }
    }, [content]);

    return (
        <div
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: content || "" }}
        />
    );
};

const InstructorStudentLessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filesLoading, setFilesLoading] = useState(false);

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
            case 'mp4':
            case 'avi':
            case 'mov':
                return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
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

    const truncateFileName = (fileName, maxLength = 30) => {
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

    const fetchLessonDetails = async () => {
        setLoading(true);
        try {
            const response = await fetchLessonByIdApi(lessonId);
            if (response.code === 1000 && response.result) {
                setLesson(response.result);
                await fetchLessonFiles();
            } else {
                message.error(response.message || 'Không thể tải thông tin bài học');
            }
        } catch (error) {
            console.error('Error fetching lesson details:', error);
            // Nếu lesson ID không tồn tại, hiển thị thông báo lỗi chi tiết hơn
            if (error.code === 1006 || (error.response && error.response.status === 404)) {
                message.error('Bài học không tồn tại hoặc đã bị xóa');
            } else {
                message.error('Không thể tải thông tin bài học: ' + (error.message || 'Lỗi không xác định'));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLessonFiles = async () => {
        setFilesLoading(true);
        try {
            const response = await fetchLessonDocumentsApi(lessonId);
            if (response.code === 1000 && response.result) {
                setFiles(response.result);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error('Error fetching lesson documents:', error);
            setFiles([]);
        } finally {
            setFilesLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) {
            fetchLessonDetails();
        }
    }, [lessonId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleFileDownload = async (file) => {
        try {
            const response = await downloadLessonDocumentApi(lessonId, file.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.fileName || file.originalFileName || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Tải xuống thành công');
        } catch (error) {
            console.error('Error downloading document:', error);
            message.error('Không thể tải xuống tài liệu');
            
            // Fallback to old method if API fails
            if (file.downloadUrl) {
                window.open(file.downloadUrl, '_blank');
            } else {
                const fileUrl = getDisplayImageUrl(file.filePath);
                if (fileUrl) {
                    window.open(fileUrl, '_blank');
                }
            }
        }
    };

    const renderLessonContent = () => {
        if (!lesson.content) {
            return <Text style={{ color: '#666', fontStyle: 'italic' }}>Chưa có nội dung bài học</Text>;
        }

        return <LessonContentRenderer content={lesson.content} />;
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

    if (!lesson) {
        return (
            <div style={{ padding: '40px' }}>
                <Empty 
                    description="Không tìm thấy thông tin bài học"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={handleBack}>
                        Quay lại
                    </Button>
                </Empty>
            </div>
        );
    }

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
                    Xem bài học dành cho học viên
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                {/* Cột trái - Nội dung bài học */}
                <Col xs={24} lg={16}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        styles={{ body: { padding: '32px' } }}
                    >
                        {/* Header bài học */}
                        <div style={{ marginBottom: '32px' }}>
                            <Title level={1} style={{ 
                                fontSize: '28px', 
                                fontWeight: 'bold',
                                color: '#1890ff',
                                marginBottom: '16px'
                            }}>
                                {lesson.title}
                            </Title>

                            {/* Mô tả bài học */}
                            {lesson.description && (
                                <div style={{ 
                                    marginBottom: '24px',
                                    padding: '16px',
                                    backgroundColor: '#f6ffed',
                                    border: '1px solid #b7eb8f',
                                    borderRadius: '8px'
                                }}>
                                    <Text style={{ 
                                        fontSize: '16px',
                                        lineHeight: '1.6',
                                        color: '#52c41a',
                                        fontStyle: 'italic'
                                    }}>
                                        {lesson.description}
                                    </Text>
                                </div>
                            )}

                            {/* Thông tin cơ bản */}
                            <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <UserOutlined style={{ color: '#1890ff' }} />
                                            <Text strong>Giảng viên:</Text>
                                            <Text style={{ color: '#666' }}>
                                                {lesson.createdBy ? 
                                                    `${lesson.createdBy.firstName} ${lesson.createdBy.lastName}` : 
                                                    'Chưa cập nhật'
                                                }
                                            </Text>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ClockCircleOutlined style={{ color: '#faad14' }} />
                                            <Text strong>Cập nhật:</Text>
                                            <Text style={{ color: '#666' }}>
                                                {lesson.updatedAt ? 
                                                    dayjs(lesson.updatedAt).format('DD/MM/YYYY HH:mm') : 
                                                    'Chưa cập nhật'
                                                }
                                            </Text>
                                        </div>
                                    </Space>
                                </Col>
                                
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        {lesson.course && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileTextOutlined style={{ color: '#52c41a' }} />
                                                <Text strong>Khóa học:</Text>
                                                <Text style={{ color: '#666' }}>
                                                    {lesson.course.title}
                                                </Text>
                                            </div>
                                        )}
                                        
                                        {lesson.displayOrder && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Text strong>Thứ tự:</Text>
                                                <Tag color="blue">Bài {lesson.displayOrder}</Tag>
                                            </div>
                                        )}
                                    </Space>
                                </Col>
                            </Row>
                        </div>

                        <Divider />

                        {/* Nội dung bài học */}
                        <div style={{ marginBottom: '32px' }}>
                            <Title level={3} style={{ 
                                color: '#1890ff',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FileTextOutlined />
                                Nội dung bài học
                            </Title>
                            
                            <Card 
                                style={{ 
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #f0f0f0'
                                }}
                                styles={{ body: { padding: '24px' } }}
                            >
                                {renderLessonContent()}
                            </Card>
                        </div>

                        {/* Hiển thị video hoặc hình ảnh nếu có */}
                        {lesson.videoUrl && (
                            <div style={{ marginBottom: '32px' }}>
                                <Title level={3} style={{ 
                                    color: '#1890ff',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <PlayCircleOutlined />
                                    Video bài học
                                </Title>
                                
                                <Card style={{ backgroundColor: '#fafafa' }}>
                                    <video
                                        controls
                                        style={{ width: '100%', maxHeight: '400px' }}
                                        src={getDisplayImageUrl(lesson.videoUrl)}
                                    >
                                        Trình duyệt của bạn không hỗ trợ phát video.
                                    </video>
                                </Card>
                            </div>
                        )}

                        {lesson.imageUrl && (
                            <div style={{ marginBottom: '32px' }}>
                                <Title level={3} style={{ 
                                    color: '#1890ff',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <PictureOutlined />
                                    Hình ảnh minh họa
                                </Title>
                                
                                <Card style={{ backgroundColor: '#fafafa', textAlign: 'center' }}>
                                    <Image
                                        src={getDisplayImageUrl(lesson.imageUrl)}
                                        alt={lesson.title}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '400px',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </Card>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Cột phải - Tài liệu liên quan */}
                <Col xs={24} lg={8}>
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
                        styles={{ body: { padding: '16px' } }}
                    >
                        {filesLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Spin />
                            </div>
                        ) : files.length === 0 ? (
                            <Empty 
                                description="Chưa có tài liệu nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <List
                                itemLayout="horizontal"
                                dataSource={files}
                                renderItem={(file) => (
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
                                        onClick={() => handleFileDownload(file)}
                                        actions={[
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileDownload(file);
                                                }}
                                                style={{ color: '#1890ff' }}
                                            />
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={getFileIcon(file.fileName || file.originalFileName)}
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
                                                        {file.title || 'Tài liệu không có tiêu đề'}
                                                    </Text>
                                                    <Text 
                                                        style={{ 
                                                            fontSize: '11px',
                                                            color: '#999',
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        File: {truncateFileName(file.fileName || file.originalFileName)}
                                                    </Text>
                                                </div>
                                            }
                                            description={
                                                <div>
                                                    {file.description && (
                                                        <Text 
                                                            style={{ 
                                                                fontSize: '12px',
                                                                color: '#666',
                                                                display: 'block',
                                                                marginBottom: '4px'
                                                            }}
                                                        >
                                                            {file.description}
                                                        </Text>
                                                    )}
                                                    <Text 
                                                        style={{ 
                                                            fontSize: '11px',
                                                            color: '#999'
                                                        }}
                                                    >
                                                        Kích thước: {file.fileSize ? 
                                                            `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                                                            'Không rõ'
                                                        }
                                                    </Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}


                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default InstructorStudentLessonView; 
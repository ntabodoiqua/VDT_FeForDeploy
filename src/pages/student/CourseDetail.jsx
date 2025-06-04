import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout,
    Menu,
    Card,
    Typography,
    List,
    Button,
    Progress,
    message,
    Modal
} from 'antd';
import {
    PlayCircleOutlined,
    CheckCircleOutlined,
    LockOutlined
} from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Paragraph } = Typography;

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchCourseDetail = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch course detail
            // const response = await fetchCourseDetailApi(courseId);
            // setCourse(response.data.course);
            // setLessons(response.data.lessons);
            
            // Temporary mock data
            setCourse({
                id: courseId,
                title: 'Lập trình React cơ bản',
                description: 'Khóa học lập trình React dành cho người mới bắt đầu',
                instructor: 'Nguyễn Văn A',
                image: 'https://via.placeholder.com/800x400',
                progress: 60,
                totalLessons: 20,
                completedLessons: 12
            });

            setLessons([
                {
                    id: 1,
                    title: 'Giới thiệu về React',
                    duration: '30 phút',
                    status: 'completed',
                    videoUrl: 'https://example.com/video1'
                },
                {
                    id: 2,
                    title: 'Components và Props',
                    duration: '45 phút',
                    status: 'in-progress',
                    videoUrl: 'https://example.com/video2'
                },
                {
                    id: 3,
                    title: 'State và Lifecycle',
                    duration: '60 phút',
                    status: 'locked',
                    videoUrl: 'https://example.com/video3'
                }
            ]);
        } catch (error) {
            message.error('Không thể tải thông tin khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetail();
    }, [courseId]);

    const handleLessonClick = (lesson) => {
        if (lesson.status === 'locked') {
            message.warning('Bạn cần hoàn thành bài học trước để mở khóa bài học này');
            return;
        }
        setSelectedLesson(lesson);
        setModalVisible(true);
    };

    const handleCompleteLesson = async (lessonId) => {
        try {
            // TODO: Implement API call to mark lesson as completed
            // await completeLessonApi(lessonId);
            message.success('Chúc mừng bạn đã hoàn thành bài học!');
            fetchCourseDetail(); // Refresh course data
        } catch (error) {
            message.error('Không thể cập nhật trạng thái bài học');
        }
    };

    const getLessonIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'in-progress':
                return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
            case 'locked':
                return <LockOutlined style={{ color: '#d9d9d9' }} />;
            default:
                return null;
        }
    };

    if (loading || !course) {
        return <div>Loading...</div>;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={{ padding: '24px' }}>
                <Card
                    cover={<img alt={course.title} src={course.image} />}
                    style={{ marginBottom: 24 }}
                >
                    <Title level={2}>{course.title}</Title>
                    <Paragraph>{course.description}</Paragraph>
                    <Paragraph>Giảng viên: {course.instructor}</Paragraph>
                    <Progress
                        percent={course.progress}
                        status="active"
                        format={percent => `${percent}% hoàn thành`}
                    />
                    <Paragraph>
                        Bài học: {course.completedLessons}/{course.totalLessons}
                    </Paragraph>
                </Card>

                <Card title="Danh sách bài học">
                    <List
                        itemLayout="horizontal"
                        dataSource={lessons}
                        renderItem={lesson => (
                            <List.Item
                                actions={[
                                    lesson.status === 'completed' ? (
                                        <Button type="link" onClick={() => handleLessonClick(lesson)}>
                                            Xem lại
                                        </Button>
                                    ) : lesson.status === 'in-progress' ? (
                                        <Button type="primary" onClick={() => handleLessonClick(lesson)}>
                                            Tiếp tục học
                                        </Button>
                                    ) : (
                                        <Button disabled icon={<LockOutlined />}>
                                            Khóa
                                        </Button>
                                    )
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={getLessonIcon(lesson.status)}
                                    title={lesson.title}
                                    description={`Thời lượng: ${lesson.duration}`}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            </Content>

            <Modal
                title={selectedLesson?.title}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button
                        key="complete"
                        type="primary"
                        onClick={() => {
                            handleCompleteLesson(selectedLesson?.id);
                            setModalVisible(false);
                        }}
                        disabled={selectedLesson?.status === 'completed'}
                    >
                        Hoàn thành bài học
                    </Button>
                ]}
                width={800}
            >
                {selectedLesson && (
                    <div>
                        <iframe
                            width="100%"
                            height="400"
                            src={selectedLesson.videoUrl}
                            title={selectedLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default CourseDetail; 
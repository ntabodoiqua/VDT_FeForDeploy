import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlayCircleOutlined } from '@ant-design/icons';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchMyCourses = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch enrolled courses
            // const response = await fetchEnrolledCoursesApi();
            // setCourses(response.data);
            
            // Temporary mock data
            setCourses([
                {
                    id: 1,
                    title: 'Lập trình React cơ bản',
                    description: 'Khóa học lập trình React dành cho người mới bắt đầu',
                    instructor: 'Nguyễn Văn A',
                    image: 'https://via.placeholder.com/300x200',
                    progress: 60,
                    totalLessons: 20,
                    completedLessons: 12,
                    lastAccessed: '2024-03-15'
                },
                {
                    id: 2,
                    title: 'Lập trình Node.js nâng cao',
                    description: 'Khóa học Node.js dành cho người đã có kinh nghiệm',
                    instructor: 'Trần Thị B',
                    image: 'https://via.placeholder.com/300x200',
                    progress: 30,
                    totalLessons: 15,
                    completedLessons: 5,
                    lastAccessed: '2024-03-14'
                }
            ]);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const handleContinueLearning = (courseId) => {
        navigate(`/student/learning/${courseId}`);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (courses.length === 0) {
        return (
            <Empty
                description="Bạn chưa đăng ký khóa học nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
                <Button type="primary" onClick={() => navigate('/student/available-courses')}>
                    Khám phá khóa học
                </Button>
            </Empty>
        );
    }

    return (
        <div>
            <h2>Khóa học của tôi</h2>
            <Row gutter={[24, 24]}>
                {courses.map(course => (
                    <Col xs={24} sm={12} md={8} key={course.id}>
                        <Card
                            hoverable
                            cover={<img alt={course.title} src={course.image} />}
                            actions={[
                                <Button
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => handleContinueLearning(course.id)}
                                >
                                    Tiếp tục học
                                </Button>
                            ]}
                        >
                            <Card.Meta
                                title={course.title}
                                description={
                                    <>
                                        <p>{course.description}</p>
                                        <p>Giảng viên: {course.instructor}</p>
                                        <Progress
                                            percent={course.progress}
                                            status="active"
                                            format={percent => `${percent}% hoàn thành`}
                                        />
                                        <p>
                                            Bài học: {course.completedLessons}/{course.totalLessons}
                                        </p>
                                        <p>
                                            Truy cập lần cuối: {course.lastAccessed}
                                        </p>
                                    </>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default MyCourses; 
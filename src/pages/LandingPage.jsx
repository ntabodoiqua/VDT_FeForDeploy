import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Input, Button, Typography, Space, Card, Avatar, Rate, Tag, Carousel } from 'antd';
import { SearchOutlined, FacebookOutlined, GithubOutlined, InstagramOutlined, MailOutlined, PhoneOutlined, TrophyOutlined, CrownOutlined, StarOutlined, BookOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import logo from '../assets/images/logo.png';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

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


// Mock Data for placeholders
const popularCourses = [
    {
        id: 1,
        title: 'ReactJS cho người mới bắt đầu',
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
        category: { name: 'Lập trình Web' },
        instructor: { firstName: 'John', lastName: 'Doe' },
        totalLessons: 25,
        averageRating: 4.8,
        totalReviews: 120,
        price: 599000,
        isActive: true,
        enrollmentCount: 1500,
    },
    {
        id: 2,
        title: 'Thiết kế UI/UX với Figma',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=1974&auto=format&fit=crop',
        category: { name: 'Thiết kế' },
        instructor: { firstName: 'Jane', lastName: 'Smith' },
        totalLessons: 30,
        averageRating: 4.9,
        totalReviews: 250,
        price: 799000,
        isActive: true,
        enrollmentCount: 2100,
    },
    {
        id: 3,
        title: 'Machine Learning cơ bản',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555255707-c07969071362?q=80&w=2070&auto=format&fit=crop',
        category: { name: 'AI & Machine Learning' },
        instructor: { firstName: 'Alan', lastName: 'Turing' },
        totalLessons: 40,
        averageRating: 4.7,
        totalReviews: 95,
        price: 999000,
        isActive: true,
        enrollmentCount: 980,
    },
    {
        id: 4,
        title: 'Quản lý dự án với Agile & Scrum',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop',
        category: { name: 'Kinh doanh' },
        instructor: { firstName: 'Peter', lastName: 'Drucker' },
        totalLessons: 20,
        averageRating: 4.8,
        totalReviews: 150,
        price: 499000,
        isActive: false,
        enrollmentCount: 1200,
    },
];

const topInstructors = [
    {
        id: 1,
        firstName: 'Alex',
        lastName: 'Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop',
        bio: 'Chuyên gia phát triển Web với hơn 10 năm kinh nghiệm.',
        totalStudents: 5000,
        totalCourses: 15,
        averageRating: 4.9,
        totalReviews: 800,
        experienceYears: 10,
    },
    {
        id: 2,
        firstName: 'Maria',
        lastName: 'Garcia',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop',
        bio: 'Nhà thiết kế từng đoạt giải thưởng, đam mê chia sẻ kiến thức.',
        totalStudents: 8000,
        totalCourses: 12,
        averageRating: 4.9,
        totalReviews: 1200,
        experienceYears: 8,
    },
    {
        id: 3,
        firstName: 'David',
        lastName: 'Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop',
        bio: 'Kỹ sư AI tại một công ty công nghệ hàng đầu.',
        totalStudents: 3500,
        totalCourses: 8,
        averageRating: 4.8,
        totalReviews: 450,
        experienceYears: 6,
    },
    {
        id: 4,
        firstName: 'Emily',
        lastName: 'Wang',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
        bio: 'Bậc thầy về phương pháp Agile và tối ưu hóa quy trình.',
        totalStudents: 6000,
        totalCourses: 20,
        averageRating: 4.8,
        totalReviews: 950,
        experienceYears: 12,
    },
];

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

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, []);

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
                            {popularCourses.map((course, index) => (
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
                                                            <Rate disabled defaultValue={course.averageRating} style={{ fontSize: '14px' }} />
                                                            <span style={{ fontSize: '12px', marginLeft: 4 }}>({course.averageRating})</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: 8 }}>
                                                        <Tag color="orange">🔥 {course.enrollmentCount} lượt đăng ký</Tag>
                                                    </div>
                                                    <Title level={4} style={{ color: '#f5222d', marginTop: 'auto', paddingTop: 16 }}>
                                                        {course.price.toLocaleString('vi-VN')} VNĐ
                                                    </Title>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
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
                            {topInstructors.map((instructor) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={instructor.id}>
                                    <Card hoverable style={{ height: '100%', textAlign: 'center' }}>
                                        <Avatar size={100} src={getDisplayImageUrl(instructor.avatarUrl)} icon={<UserOutlined />} style={{ border: '4px solid #1890ff', marginBottom: 16 }} />
                                        <Title level={4}>{instructor.firstName} {instructor.lastName}</Title>
                                        <Paragraph type="secondary" style={{ minHeight: 40 }}>{instructor.bio}</Paragraph>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                            <Rate disabled defaultValue={instructor.averageRating} style={{ fontSize: '14px' }} />
                                            <span style={{ marginLeft: 8 }}>{instructor.averageRating.toFixed(1)}/5 ({instructor.totalReviews} đánh giá)</span>
                                        </div>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Row style={{ width: '100%' }}>
                                                <Col span={12}><Text strong><TeamOutlined /> {instructor.totalStudents}</Text></Col>
                                                <Col span={12}><Text strong><BookOutlined /> {instructor.totalCourses}</Text></Col>
                                            </Row>
                                            <Tag color="blue">{instructor.experienceYears} năm kinh nghiệm</Tag>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
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
        </Layout>
    );
};

export default LandingPage; 
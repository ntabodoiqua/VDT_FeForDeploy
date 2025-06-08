import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Rate,
    Input,
    Button,
    Typography,
    Space,
    message,
    Spin,
    Avatar,
    List,
    Divider,
    Empty,
    Tag,
    Row,
    Col,
    Pagination
} from 'antd';
import {
    ArrowLeftOutlined,
    StarOutlined,
    UserOutlined,
    BookOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import {
    fetchCourseByIdApi,
    createCourseReviewApi,
    fetchPublicCourseReviewsApi,
    fetchMyEnrollmentForCourseApi
} from '../../util/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CourseReview = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    
    // Review form state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);
    
    // Reviews display state
    const [reviews, setReviews] = useState([]);
    const [reviewsPagination, setReviewsPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return 'https://via.placeholder.com/300x200';
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        return urlPath;
    };

    const fetchCourseAndEnrollment = async () => {
        setLoading(true);
        try {
            const [courseResponse, enrollmentResponse] = await Promise.all([
                fetchCourseByIdApi(courseId),
                fetchMyEnrollmentForCourseApi(courseId)
            ]);

            if (courseResponse.code === 1000 && courseResponse.result) {
                setCourse(courseResponse.result);
            }

            if (enrollmentResponse.code === 1000 && enrollmentResponse.result) {
                setEnrollment(enrollmentResponse.result);
                
                // Check if enrollment is completed (100% progress)
                if (enrollmentResponse.result.progress < 1.0) {
                    message.warning('Bạn cần hoàn thành khóa học trước khi đánh giá!');
                    navigate(`/student/learning/${courseId}`);
                    return;
                }
            } else {
                message.error('Bạn chưa đăng ký khóa học này!');
                navigate('/student/my-courses');
                return;
            }
        } catch (error) {
            console.error('Error fetching course data:', error);
            message.error('Không thể tải thông tin khóa học');
            navigate('/student/my-courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (page = 1) => {
        setReviewsLoading(true);
        try {
            const response = await fetchPublicCourseReviewsApi(courseId, {
                page: page - 1,
                size: reviewsPagination.pageSize
            });

            if (response.code === 1000 && response.result) {
                const reviewsData = response.result;
                setReviews(reviewsData.content || []);
                setReviewsPagination(prev => ({
                    ...prev,
                    current: page,
                    total: reviewsData.totalElements || 0
                }));

                // Check if current user has already reviewed
                const currentUserId = enrollment?.student?.id;
                const userReview = reviewsData.content?.find(review => 
                    review.student?.id === currentUserId
                );
                setHasReviewed(!!userReview);
                
                if (userReview) {
                    setRating(userReview.rating);
                    setComment(userReview.comment || '');
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            message.error('Không thể tải đánh giá khóa học');
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            message.error('Vui lòng chọn số sao đánh giá!');
            return;
        }

        if (!comment.trim()) {
            message.error('Vui lòng viết nhận xét về khóa học!');
            return;
        }

        setSubmitLoading(true);
        try {
            const reviewData = {
                rating,
                comment: comment.trim()
            };

            const response = await createCourseReviewApi(courseId, reviewData);
            
                                        if (response.code === 1000) {
                                message.success('Đánh giá của bạn đã được gửi thành công! Đánh giá sẽ được hiển thị sau khi admin/giảng viên phê duyệt.');
                                setHasReviewed(true);
                                
                                // Refresh reviews list
                                await fetchReviews(1);
                            } else {
                                message.error(response.message || 'Có lỗi xảy ra khi gửi đánh giá');
                            }
        } catch (error) {
            console.error('Error submitting review:', error);
            if (error.response?.status === 400) {
                message.error('Bạn đã đánh giá khóa học này rồi!');
                setHasReviewed(true);
            } else {
                message.error('Có lỗi xảy ra khi gửi đánh giá');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/student/my-courses');
    };

    const handleReviewsPaginationChange = (page) => {
        fetchReviews(page);
    };

    useEffect(() => {
        if (courseId) {
            fetchCourseAndEnrollment();
        }
    }, [courseId]);

    useEffect(() => {
        if (course && enrollment) {
            fetchReviews(1);
        }
    }, [course, enrollment]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!course || !enrollment) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <Empty description="Không tìm thấy khóa học" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <Card style={{ marginBottom: '24px' }}>
                    <Space align="start" style={{ width: '100%' }}>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={handleBack}
                            style={{ marginTop: '8px' }}
                        >
                            Quay lại
                        </Button>
                        <div style={{ flex: 1 }}>
                            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                                <BookOutlined style={{ marginRight: '8px' }} />
                                Đánh giá khóa học
                            </Title>
                            <Text type="secondary">
                                Chia sẻ trải nghiệm học tập của bạn với cộng đồng
                            </Text>
                        </div>
                    </Space>
                </Card>

                <Row gutter={[24, 24]}>
                    {/* Course Info */}
                    <Col xs={24} lg={8}>
                        <Card style={{ height: 'fit-content' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <img
                                    src={getDisplayImageUrl(course.thumbnailUrl)}
                                    alt={course.title}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                            
                            <Title level={4} style={{ textAlign: 'center', marginBottom: '16px' }}>
                                {course.title}
                            </Title>
                            
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong>Giảng viên:</Text>
                                    <Text>{course.instructor?.firstName} {course.instructor?.lastName}</Text>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong>Danh mục:</Text>
                                    <Tag color="blue">{course.category?.name}</Tag>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong>Tiến độ:</Text>
                                    <Tag color="green">
                                        <CheckCircleOutlined style={{ marginRight: '4px' }} />
                                        Hoàn thành 100%
                                    </Tag>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong>Đánh giá trung bình:</Text>
                                    <Space>
                                        <Rate disabled allowHalf value={course.averageRating} style={{ fontSize: '14px' }} />
                                        <Text>({course.averageRating?.toFixed(1) || '0'})</Text>
                                    </Space>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Review Form & Reviews List */}
                    <Col xs={24} lg={16}>
                        {/* Review Form */}
                        {!hasReviewed ? (
                            <Card title="Đánh giá khóa học" style={{ marginBottom: '24px' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="large">
                                    <div>
                                        <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                                            Số sao đánh giá *
                                        </Text>
                                        <Rate 
                                            value={rating} 
                                            onChange={setRating}
                                            style={{ fontSize: '32px' }}
                                        />
                                        {rating > 0 && (
                                            <Text style={{ marginLeft: '16px', fontSize: '16px', color: '#1890ff' }}>
                                                {rating === 1 && 'Rất không hài lòng'}
                                                {rating === 2 && 'Không hài lòng'}
                                                {rating === 3 && 'Bình thường'}
                                                {rating === 4 && 'Hài lòng'}
                                                {rating === 5 && 'Rất hài lòng'}
                                            </Text>
                                        )}
                                    </div>

                                    <div>
                                        <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                                            Nhận xét của bạn *
                                        </Text>
                                        <TextArea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            placeholder="Chia sẻ trải nghiệm học tập của bạn về khóa học này..."
                                            maxLength={1000}
                                            showCount
                                        />
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        loading={submitLoading}
                                        onClick={handleSubmitReview}
                                        disabled={rating === 0 || !comment.trim()}
                                        icon={<StarOutlined />}
                                    >
                                        Gửi đánh giá
                                    </Button>
                                </Space>
                            </Card>
                        ) : (
                            <Card style={{ marginBottom: '24px', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                                <Space align="center">
                                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                                    <div>
                                        <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
                                            Cảm ơn bạn đã đánh giá!
                                        </Title>
                                        <Text>Đánh giá của bạn đã được gửi và đang chờ admin/giảng viên phê duyệt.</Text>
                                    </div>
                                </Space>
                            </Card>
                        )}

                        {/* Reviews List */}
                        <Card title={`Đánh giá từ học viên (${reviewsPagination.total})`}>
                            {reviewsLoading ? (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Spin size="large" />
                                </div>
                            ) : reviews.length > 0 ? (
                                <>
                                    <List
                                        dataSource={reviews}
                                        renderItem={(review) => (
                                            <List.Item style={{ padding: '16px 0' }}>
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar 
                                                            src={review.student?.avatarUrl} 
                                                            icon={<UserOutlined />}
                                                            size="large"
                                                        />
                                                    }
                                                    title={
                                                        <div>
                                                            <Space>
                                                                <Text strong>
                                                                    {review.student?.firstName} {review.student?.lastName}
                                                                </Text>
                                                                <Rate 
                                                                    disabled 
                                                                    value={review.rating} 
                                                                    style={{ fontSize: '14px' }}
                                                                />
                                                            </Space>
                                                            <div>
                                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                    {dayjs(review.reviewDate).format('DD/MM/YYYY')}
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    }
                                                    description={
                                                        <Paragraph style={{ marginBottom: 0, marginTop: '8px' }}>
                                                            {review.comment}
                                                        </Paragraph>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                    
                                    {reviewsPagination.total > reviewsPagination.pageSize && (
                                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                            <Pagination
                                                current={reviewsPagination.current}
                                                pageSize={reviewsPagination.pageSize}
                                                total={reviewsPagination.total}
                                                onChange={handleReviewsPaginationChange}
                                                showTotal={(total, range) => 
                                                    `${range[0]}-${range[1]} của ${total} đánh giá`
                                                }
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Empty
                                    description="Chưa có đánh giá nào"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default CourseReview; 
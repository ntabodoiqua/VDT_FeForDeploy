import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message, Rate, Tag, Radio, Avatar, Space, Switch, Divider, Typography } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined, StarOutlined, TrophyOutlined, QuestionCircleOutlined, CheckCircleOutlined, BarChartOutlined, SettingOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { fetchUsersApi, fetchCoursesApi, fetchAllSystemLessonsApi, fetchAllReviewsApi, fetchAllEnrollmentsApi, fetchPopularCoursesApi, fetchQuizzesApi, fetchQuizSummaryApi, fetchTopInstructorsApi } from '../../util/api';
import { Link } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Statistics = () => {
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalLessons: 0,
        totalReviews: 0
    });
    const [recentEnrollments, setRecentEnrollments] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [popularCourses, setPopularCourses] = useState([]);
    const [popularCoursesLimit, setPopularCoursesLimit] = useState(5);
    const [loadingPopular, setLoadingPopular] = useState(false);

    // Instructor statistics
    const [topInstructors, setTopInstructors] = useState([]);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    // Quiz statistics
    const [quizStatistics, setQuizStatistics] = useState({
        totalQuizzes: 0,
        totalQuizAttempts: 0,
        averageQuizScore: 0,
        quizSuccessRate: 0
    });
    const [topQuizzes, setTopQuizzes] = useState([]);
    const [loadingQuizStats, setLoadingQuizStats] = useState(false);
    
    // Visibility state
    const [visibleSections, setVisibleSections] = useState({
        summaryStats: true,
        quizSummaryStats: true,
        recentEnrollments: true,
        popularCourses: true,
        recentReviews: true,
        topQuizzes: true,
        topInstructors: true,
    });

    const handleVisibilityChange = (checked, section) => {
        setVisibleSections(prev => ({ ...prev, [section]: checked }));
    };

    const popularCoursesColumns = [
        {
            title: 'Hạng',
            key: 'rank',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Khóa học',
            dataIndex: ['course', 'title'],
            key: 'courseTitle',
            render: (text, record) => <Link to={`/admin/courses`}>{text}</Link>,
        },
        {
            title: 'Số lượt đăng ký',
            dataIndex: 'enrollmentCount',
            key: 'enrollmentCount',
        },
    ];

    const reviewColumns = [
        {
            title: 'Học viên',
            dataIndex: ['student', 'username'],
            key: 'studentName',
        },
        {
            title: 'Khóa học',
            dataIndex: ['course', 'title'],
            key: 'courseName',
            render: (text, record) => <Link to={`/admin/courses`}>{text}</Link>
        },
        {
            title: 'Đánh giá',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => <Rate disabled defaultValue={rating} />
        },
        {
            title: 'Bình luận',
            dataIndex: 'comment',
            key: 'comment',
        },
        {
            title: 'Ngày',
            dataIndex: 'reviewDate',
            key: 'reviewDate',
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (text, record) => {
                if (record.rejected) {
                    return <Tag color="red">Bị từ chối</Tag>;
                }
                if (record.approved) {
                    return <Tag color="green">Đã duyệt</Tag>;
                }
                return <Tag color="blue">Chờ duyệt</Tag>;
            }
        }
    ];

    const columns = [
        {
            title: 'Học viên',
            dataIndex: ['student', 'username'],
            key: 'studentName',
        },
        {
            title: 'Khóa học',
            dataIndex: ['course', 'title'],
            key: 'courseName',
        },
        {
            title: 'Ngày đăng ký',
            dataIndex: 'enrollmentDate',
            key: 'enrollmentDate',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'approvalStatus',
            key: 'approvalStatus',
            render: (status) => {
                let color;
                if (status === 'REJECTED') {
                    color = 'volcano';
                } else if (status === 'APPROVED') {
                    color = 'green';
                } else {
                    color = 'geekblue';
                }
                return <Tag color={color}>{status}</Tag>;
            }
        }
    ];

    const topQuizzesColumns = [
        {
            title: 'Hạng',
            key: 'rank',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'PRACTICE' ? 'blue' : 'orange'}>
                    {type === 'PRACTICE' ? 'Luyện tập' : 'Đánh giá'}
                </Tag>
            ),
        },
        {
            title: 'Người tạo',
            dataIndex: ['createdBy', 'firstName'],
            key: 'creator',
            render: (text, record) => `${record.createdBy?.firstName || ''} ${record.createdBy?.lastName || ''}`,
        },
        {
            title: 'Lượt thử',
            dataIndex: 'totalAttempts',
            key: 'totalAttempts',
        },
        {
            title: 'Tỷ lệ đạt',
            dataIndex: 'successRate',
            key: 'successRate',
            render: (rate) => `${rate}%`,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Tạm dừng'}
                </Tag>
            ),
        }
    ];

    const topInstructorsColumns = [
        {
            title: 'Hạng',
            key: 'rank',
            render: (text, record, index) => index + 1,
            width: 60,
        },
        {
            title: 'Giảng viên',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatarUrl && `http://localhost:8080/lms${record.avatarUrl}`} icon={<UserOutlined />} />
                    <span>{`${record.lastName} ${record.firstName}`}</span>
                </Space>
            )
        },
        {
            title: 'Học viên',
            dataIndex: 'totalStudents',
            key: 'totalStudents',
            width: 100,
        },
        {
            title: 'Khóa học',
            dataIndex: 'totalCourses',
            key: 'totalCourses',
            width: 100,
        },
        {
            title: 'Đánh giá',
            dataIndex: 'averageRating',
            key: 'averageRating',
            render: (rating) => (
                <Space>
                    <StarOutlined style={{ color: '#fadb14' }} />
                    <span>{rating?.toFixed(1) || 0}</span>
                </Space>
            ),
            width: 100,
        },
    ];

    const fetchPopularCourses = async () => {
        setLoadingPopular(true);
        try {
            const response = await fetchPopularCoursesApi({ limit: popularCoursesLimit });
            if (response && response.result) {
                setPopularCourses(response.result.map(c => ({ ...c, key: c.course.id })));
            } else {
                message.error(response?.message || 'Không thể tải khóa học phổ biến.');
            }
        } catch (error) {
            console.error('Error fetching popular courses:', error);
            message.error('Lỗi khi tải khóa học phổ biến.');
        } finally {
            setLoadingPopular(false);
        }
    };

    const fetchTopInstructorsData = async () => {
        setLoadingInstructors(true);
        try {
            const response = await fetchTopInstructorsApi({ limit: 5 });
            if (response && response.code === 1000) {
                setTopInstructors(response.result.map(i => ({ ...i, key: i.id })));
            } else {
                message.error(response?.message || 'Không thể tải giảng viên hàng đầu.');
            }
        } catch (error) {
            console.error('Error fetching top instructors:', error);
            message.error('Lỗi khi tải giảng viên hàng đầu.');
        } finally {
            setLoadingInstructors(false);
        }
    };

    // Fetch all quiz statistics for admin
    const fetchQuizStatistics = async () => {
        setLoadingQuizStats(true);
        try {
            // Lấy danh sách tất cả quiz trong hệ thống
            const quizzesResponse = await fetchQuizzesApi({
                page: 0,
                size: 1000, // Lấy tất cả quiz để tính thống kê
                sortBy: 'createdAt',
                sortDir: 'desc'
            });

            if (quizzesResponse && quizzesResponse.code === 1000 && quizzesResponse.result) {
                const quizzes = quizzesResponse.result.content || [];
                
                // Tính toán thống kê quiz
                let totalAttempts = 0;
                let totalScore = 0;
                let totalPassed = 0;
                let attemptCount = 0;
                const quizSummaries = [];

                // Lấy summary cho từng quiz để tính thống kê chi tiết
                for (const quiz of quizzes.slice(0, 15)) { // Giới hạn 15 quiz đầu tiên để tránh quá tải
                    try {
                        const summaryResponse = await fetchQuizSummaryApi(quiz.id);
                        if (summaryResponse && summaryResponse.code === 1000 && summaryResponse.result) {
                            const summary = summaryResponse.result;
                            totalAttempts += summary.totalAttempts || 0;
                            totalPassed += summary.passedAttempts || 0;
                            
                            quizSummaries.push({
                                key: quiz.id,
                                title: quiz.title,
                                type: quiz.type,
                                createdBy: quiz.createdBy,
                                totalAttempts: summary.totalAttempts || 0,
                                passedAttempts: summary.passedAttempts || 0,
                                successRate: summary.totalAttempts > 0 ? 
                                    ((summary.passedAttempts / summary.totalAttempts) * 100).toFixed(1) : 0,
                                isActive: quiz.isActive
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching summary for quiz ${quiz.id}:`, error);
                    }
                }

                const averageScore = attemptCount > 0 ? (totalScore / attemptCount).toFixed(1) : 0;
                const successRate = totalAttempts > 0 ? ((totalPassed / totalAttempts) * 100).toFixed(1) : 0;

                setQuizStatistics({
                    totalQuizzes: quizzes.length,
                    totalQuizAttempts: totalAttempts,
                    averageQuizScore: averageScore,
                    quizSuccessRate: successRate
                });

                // Sắp xếp quiz theo số lượt thử nhiều nhất
                const sortedQuizzes = quizSummaries.sort((a, b) => b.totalAttempts - a.totalAttempts);
                setTopQuizzes(sortedQuizzes.slice(0, 5));

                console.log('Admin quiz statistics loaded successfully');
            } else {
                message.error(quizzesResponse?.message || 'Không thể tải dữ liệu quiz.');
            }
        } catch (error) {
            console.error('Error fetching quiz statistics:', error);
            message.error('Lỗi khi tải thống kê quiz: ' + (error.message || 'Unknown error'));
        } finally {
            setLoadingQuizStats(false);
        }
    };

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            // Fetch all statistics concurrently
            const [usersResponse, coursesResponse, lessonsResponse, reviewsResponse, enrollmentsResponse] = await Promise.all([
                fetchUsersApi({ size: 1 }),
                fetchCoursesApi({ size: 1 }),
                fetchAllSystemLessonsApi({ size: 1 }),
                fetchAllReviewsApi({ page: 0, size: 5, sort: 'reviewDate,desc' }),
                fetchAllEnrollmentsApi({ page: 0, size: 5, sort: 'enrollmentDate,desc' })
            ]);

            const totalUsers = usersResponse?.result?.totalElements || 0;
            const totalCourses = coursesResponse?.result?.totalElements || 0;
            const totalLessons = lessonsResponse?.result?.totalElements || 0;
            const totalReviews = reviewsResponse?.result?.totalElements || 0;
            const recentReviewsData = reviewsResponse?.result?.content || [];
            const recentEnrollmentsData = enrollmentsResponse?.result?.content || [];

            if (usersResponse?.code !== 1000) {
                message.error(usersResponse?.message || 'Không thể tải tổng số người dùng.');
            }
            if (coursesResponse?.code !== 1000) {
                message.error(coursesResponse?.message || 'Không thể tải tổng số khóa học.');
            }
            if (lessonsResponse?.code !== 1000) {
                message.error(lessonsResponse?.message || 'Không thể tải tổng số bài học.');
            }
            if (reviewsResponse?.code !== 1000) {
                message.error(reviewsResponse?.message || 'Không thể tải dữ liệu đánh giá.');
            }
            if (enrollmentsResponse?.code !== 1000) {
                message.error(enrollmentsResponse?.message || 'Không thể tải dữ liệu đăng ký.');
            }

            setStatistics({
                totalUsers,
                totalCourses,
                totalLessons,
                totalReviews
            });

            setRecentReviews(recentReviewsData.map(r => ({ ...r, key: r.id })));
            setRecentEnrollments(recentEnrollmentsData.map(e => ({ ...e, key: e.id })));
        } catch (error) {
            console.error('Error fetching statistics:', error);
            message.error('Lỗi khi tải dữ liệu thống kê.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
        fetchQuizStatistics();
        fetchTopInstructorsData();
    }, []);

    useEffect(() => {
        fetchPopularCourses();
    }, [popularCoursesLimit]);

    const handleDateRangeChange = (dates) => {
        if (dates) {
            // TODO: Implement API call to fetch statistics for date range
            console.log('Date range:', dates);
        }
    };

    const tableCards = [
        {
            key: 'topInstructors',
            title: <><TrophyOutlined style={{ color: '#faad14' }} /> Top Giảng viên</>,
            content: <Table columns={topInstructorsColumns} dataSource={topInstructors} rowKey="key" loading={loadingInstructors} pagination={false} size="small" scroll={{ x: 'max-content' }} />
        },
        {
            key: 'popularCourses',
            title: <><TrophyOutlined /> Khóa học phổ biến nhất</>,
            extra: (
                <Radio.Group value={popularCoursesLimit} onChange={(e) => setPopularCoursesLimit(e.target.value)} size="small">
                    <Radio.Button value={5}>Top 5</Radio.Button>
                    <Radio.Button value={10}>Top 10</Radio.Button>
                </Radio.Group>
            ),
            content: <Table columns={popularCoursesColumns} dataSource={popularCourses} rowKey="key" loading={loadingPopular} pagination={false} size="small" scroll={{ x: 'max-content' }} />
        },
        {
            key: 'topQuizzes',
            title: <><QuestionCircleOutlined /> Top Quiz được làm nhiều nhất</>,
            content: <Table columns={topQuizzesColumns} dataSource={topQuizzes} rowKey="key" loading={loadingQuizStats} pagination={false} size="small" scroll={{ x: 'max-content' }} />
        },
        {
            key: 'recentEnrollments',
            title: 'Đăng ký gần đây',
            content: <Table columns={columns} dataSource={recentEnrollments} rowKey="key" loading={loading} pagination={false} size="small" scroll={{ x: 'max-content' }} />
        },
        {
            key: 'recentReviews',
            title: 'Đánh giá gần đây',
            content: <Table columns={reviewColumns} dataSource={recentReviews} rowKey="key" loading={loading} pagination={false} size="small" scroll={{ x: 'max-content' }} />
        }
    ].filter(card => visibleSections[card.key]);


    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>Dashboard Thống kê</Title>
            <Typography.Text type="secondary">Tổng quan về hoạt động của hệ thống.</Typography.Text>

            <Divider />

            <Card style={{ marginBottom: 24, background: '#fafafa' }}>
                <Title level={4} style={{ marginTop: 0 }}><SettingOutlined /> Tùy chọn hiển thị</Title>
                 <Row gutter={[16, 8]}>
                    {Object.keys(visibleSections).map(key => (
                        <Col key={key}>
                            <Switch
                                checked={visibleSections[key]}
                                onChange={(c) => handleVisibilityChange(c, key)}
                                checkedChildren={<EyeOutlined />}
                                unCheckedChildren={<EyeInvisibleOutlined />}
                            />
                            <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/Stats|Summary/gi, '').trim()}
                            </span>
                        </Col>
                    ))}
                </Row>
            </Card>

            {visibleSections.summaryStats && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng số người dùng" value={statistics.totalUsers} prefix={<UserOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng số khóa học" value={statistics.totalCourses} prefix={<BookOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng số bài học" value={statistics.totalLessons} prefix={<FileTextOutlined />} loading={loading} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng số review" value={statistics.totalReviews} prefix={<StarOutlined />} loading={loading} />
                        </Card>
                    </Col>
                </Row>
            )}

            {visibleSections.quizSummaryStats && (
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng số Quiz" value={quizStatistics.totalQuizzes} prefix={<QuestionCircleOutlined />} loading={loadingQuizStats} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tổng lượt làm bài" value={quizStatistics.totalQuizAttempts} prefix={<BarChartOutlined />} loading={loadingQuizStats} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Tỷ lệ đạt Quiz" value={quizStatistics.quizSuccessRate} prefix={<CheckCircleOutlined />} suffix="%" precision={1} loading={loadingQuizStats} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="Điểm trung bình" value={quizStatistics.averageQuizScore} prefix={<StarOutlined />} suffix="/10" precision={1} loading={loadingQuizStats} />
                        </Card>
                    </Col>
                </Row>
            )}

            <Divider style={{ marginTop: 24 }} />
            
            <Row gutter={[24, 24]}>
                {tableCards.map(card => (
                    <Col xs={24} lg={12} key={card.key}>
                        <Card title={card.title} extra={card.extra || null}>
                            {card.content}
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default Statistics; 
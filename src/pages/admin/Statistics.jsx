import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message, Rate, Tag, Radio } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { fetchUsersApi, fetchCoursesApi, fetchAllSystemLessonsApi, fetchAllReviewsApi, fetchAllEnrollmentsApi, fetchPopularCoursesApi } from '../../util/api';
import { Link } from 'react-router-dom';

const { RangePicker } = DatePicker;

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

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <RangePicker onChange={handleDateRangeChange} />
            </div>

            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số người dùng"
                            value={statistics.totalUsers}
                            prefix={<UserOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số khóa học"
                            value={statistics.totalCourses}
                            prefix={<BookOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số bài học"
                            value={statistics.totalLessons}
                            prefix={<FileTextOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số review"
                            value={statistics.totalReviews}
                            prefix={<StarOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                    <Card
                        title="Đăng ký gần đây"
                    >
                        <Table
                            columns={columns}
                            dataSource={recentEnrollments}
                            rowKey="key"
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><TrophyOutlined /> Khóa học phổ biến nhất</span>
                                <Radio.Group
                                    value={popularCoursesLimit}
                                    onChange={(e) => setPopularCoursesLimit(e.target.value)}
                                >
                                    <Radio.Button value={5}>Top 5</Radio.Button>
                                    <Radio.Button value={10}>Top 10</Radio.Button>
                                </Radio.Group>
                            </div>
                        }
                    >
                        <Table
                            columns={popularCoursesColumns}
                            dataSource={popularCourses}
                            rowKey="key"
                            loading={loadingPopular}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                title="Đánh giá gần đây"
                style={{ marginTop: 16 }}
            >
                <Table
                    columns={reviewColumns}
                    dataSource={recentReviews}
                    rowKey="key"
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default Statistics; 
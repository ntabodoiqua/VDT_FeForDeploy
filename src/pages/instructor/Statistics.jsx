import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message, Rate, Tag, Radio } from 'antd';
import { BookOutlined, FileTextOutlined, UserOutlined, DollarOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { fetchInstructorStatisticsApi } from '../../util/api';

const { RangePicker } = DatePicker;

const Statistics = () => {
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        totalCourses: 0,
        totalLessons: 0,
        totalStudents: 0,
        totalRevenue: 0
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
                if (record.isRejected) {
                    return <Tag color="red">Bị từ chối</Tag>;
                }
                if (record.isApproved) {
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

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await fetchInstructorStatisticsApi();
            console.log('API Response:', response); // Debug log
            
            if (response && response.code === 1000 && response.result) {
                const data = response.result;
                setStatistics({
                    totalCourses: data.totalCourses || 0,
                    totalLessons: data.totalLessons || 0,
                    totalStudents: data.totalStudents || 0,
                    totalRevenue: data.totalRevenue || 0
                });

                setRecentEnrollments((data.recentEnrollments || []).map(e => ({ ...e, key: e.id })));
                setRecentReviews((data.recentReviews || []).map(r => ({ ...r, key: r.id })));
                setPopularCourses((data.popularCourses || []).map(c => ({ ...c, key: c.course.id })));
                
                message.success('Tải dữ liệu thống kê thành công');
            } else {
                console.error('Invalid response structure:', response);
                message.error(response?.message || 'Không thể tải dữ liệu thống kê.');
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
            message.error('Lỗi khi tải dữ liệu thống kê: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

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
                            title="Tổng số học viên"
                            value={statistics.totalStudents}
                            prefix={<UserOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng doanh thu"
                            value={statistics.totalRevenue}
                            prefix={<DollarOutlined />}
                            suffix="VNĐ"
                            loading={loading}
                            formatter={(value) => value.toLocaleString('vi-VN')}
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
                            pagination={false}
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
                            dataSource={popularCourses.slice(0, popularCoursesLimit)}
                            rowKey="key"
                            loading={loadingPopular}
                            pagination={false}
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
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default Statistics; 
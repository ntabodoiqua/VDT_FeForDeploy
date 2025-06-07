import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message, Rate, Tag, Radio, Switch, Progress } from 'antd';
import { BookOutlined, FileTextOutlined, UserOutlined, StarOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, PercentageOutlined } from '@ant-design/icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { fetchInstructorStatisticsApi, fetchInstructorStatisticsFilteredApi } from '../../util/api';

const { RangePicker } = DatePicker;

const Statistics = () => {
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        totalCourses: 0,
        totalLessons: 0,
        totalStudents: 0,
        completionRate: 0,
        averageRating: 0,
        approvalRate: 0,
        activeStudents: 0
    });
    const [recentEnrollments, setRecentEnrollments] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [popularCourses, setPopularCourses] = useState([]);
    const [popularCoursesLimit, setPopularCoursesLimit] = useState(5);
    const [loadingPopular, setLoadingPopular] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    
    // Chart data from API
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [ratingTrendData, setRatingTrendData] = useState([]);

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
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => (
                <Progress 
                    percent={Math.round(progress * 100)} 
                    size="small" 
                    status={progress === 1 ? 'success' : 'active'}
                />
            )
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
                    completionRate: data.completionRate || 0,
                    averageRating: data.averageRating || 0,
                    approvalRate: data.approvalRate || 0,
                    activeStudents: data.activeStudents || 0
                });

                setRecentEnrollments((data.recentEnrollments || []).map(e => ({ ...e, key: e.id })));
                setRecentReviews((data.recentReviews || []).map(r => ({ ...r, key: r.id })));
                setPopularCourses((data.popularCourses || []).map(c => ({ ...c, key: c.course.id })));
                
                // Set chart data from API
                setEnrollmentData(data.enrollmentTrends || []);
                setCategoryData(data.categoryDistribution || []);
                setRatingTrendData(data.ratingTrends || []);
                
                console.log('Category Data:', data.categoryDistribution); // Debug log
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

    const handleDateRangeChange = async (dates) => {
        if (dates && dates.length === 2) {
            const startDate = dates[0].format('YYYY-MM-DD');
            const endDate = dates[1].format('YYYY-MM-DD');
            
            setLoading(true);
            try {
                const response = await fetchInstructorStatisticsFilteredApi(startDate, endDate);
                
                if (response && response.code === 1000 && response.result) {
                    const data = response.result;
                    
                    setStatistics({
                        totalCourses: data.totalCourses || 0,
                        totalLessons: data.totalLessons || 0,
                        totalStudents: data.totalStudents || 0,
                        completionRate: data.completionRate || 0,
                        averageRating: data.averageRating || 0,
                        approvalRate: data.approvalRate || 0,
                        activeStudents: data.activeStudents || 0
                    });

                    setRecentEnrollments((data.recentEnrollments || []).map(e => ({ ...e, key: e.id })));
                    setRecentReviews((data.recentReviews || []).map(r => ({ ...r, key: r.id })));
                    setPopularCourses((data.popularCourses || []).map(c => ({ ...c, key: c.course.id })));
                    
                    // Set chart data from API
                    setEnrollmentData(data.enrollmentTrends || []);
                    setCategoryData(data.categoryDistribution || []);
                    setRatingTrendData(data.ratingTrends || []);
                    
                    console.log('Filtered Category Data:', data.categoryDistribution); // Debug log
                    message.success(`Đã cập nhật thống kê cho khoảng thời gian ${startDate} - ${endDate}`);
                } else {
                    console.error('Invalid response structure:', response);
                    message.error(response?.message || 'Không thể tải dữ liệu thống kê theo thời gian.');
                }
            } catch (error) {
                console.error('Error fetching filtered statistics:', error);
                message.error('Lỗi khi tải thống kê theo thời gian: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        } else {
            // Reset to all-time statistics
            fetchStatistics();
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <RangePicker onChange={handleDateRangeChange} />
                <div>
                    <span style={{ marginRight: 8 }}>Hiển thị biểu đồ:</span>
                    <Switch checked={showCharts} onChange={setShowCharts} />
                </div>
            </div>

            {/* Main Statistics Cards */}
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
                            title="Đánh giá trung bình"
                            value={statistics.averageRating}
                            prefix={<StarOutlined />}
                            suffix="⭐"
                            precision={1}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Secondary Statistics Cards */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tỷ lệ hoàn thành"
                            value={statistics.completionRate}
                            prefix={<CheckCircleOutlined />}
                            suffix="%"
                            precision={1}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tỷ lệ phê duyệt"
                            value={statistics.approvalRate}
                            prefix={<PercentageOutlined />}
                            suffix="%"
                            precision={1}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Học viên đang học"
                            value={statistics.activeStudents}
                            prefix={<ClockCircleOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Khóa học phổ biến nhất"
                            value={popularCourses.length > 0 ? popularCourses[0]?.enrollmentCount : 0}
                            prefix={<TrophyOutlined />}
                            suffix="đăng ký"
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Section */}
            {showCharts && (
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={8}>
                        <Card title="Đăng ký theo tháng">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={enrollmentData.length > 0 ? enrollmentData : [
                                    { month: 'T1', enrollments: 0 },
                                    { month: 'T2', enrollments: 0 },
                                    { month: 'T3', enrollments: 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value) => [value, 'Số đăng ký']}
                                        labelFormatter={(label) => `Tháng ${label}`}
                                    />
                                    <Bar dataKey="enrollments" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card title="Phân bố theo danh mục">
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={categoryData.length > 0 ? categoryData : [
                                            { name: 'Không có dữ liệu', value: 1, color: '#d9d9d9' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {(categoryData.length > 0 ? categoryData : [
                                            { name: 'Không có dữ liệu', value: 1, color: '#d9d9d9' }
                                        ]).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [
                                            categoryData.length > 0 ? `${value} khóa học` : 'Chưa có dữ liệu', 
                                            name
                                        ]}
                                        labelFormatter={(name) => `Danh mục: ${name}`}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card title="Xu hướng đánh giá">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={ratingTrendData.length > 0 ? ratingTrendData : [
                                    { month: 'T1', rating: 0 },
                                    { month: 'T2', rating: 0 },
                                    { month: 'T3', rating: 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip 
                                        formatter={(value) => [value, 'Đánh giá trung bình']}
                                        labelFormatter={(label) => `Tháng ${label}`}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="rating" 
                                        stroke="#8884d8" 
                                        strokeWidth={2}
                                        dot={{ fill: '#8884d8' }}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                    <Card title="Đăng ký gần đây">
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
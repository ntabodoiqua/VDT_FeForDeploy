import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const Statistics = () => {
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalLessons: 0,
        totalRevenue: 0
    });
    const [recentEnrollments, setRecentEnrollments] = useState([]);

    const columns = [
        {
            title: 'Học viên',
            dataIndex: 'studentName',
            key: 'studentName',
        },
        {
            title: 'Khóa học',
            dataIndex: 'courseName',
            key: 'courseName',
        },
        {
            title: 'Ngày đăng ký',
            dataIndex: 'enrollmentDate',
            key: 'enrollmentDate',
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`
        }
    ];

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to fetch statistics
            // const response = await fetchStatisticsApi();
            // setStatistics(response.data);
            
            // Temporary mock data
            setStatistics({
                totalUsers: 150,
                totalCourses: 25,
                totalLessons: 300,
                totalRevenue: 50000000
            });

            setRecentEnrollments([
                {
                    id: 1,
                    studentName: 'Nguyễn Văn A',
                    courseName: 'Lập trình React cơ bản',
                    enrollmentDate: '2024-03-15',
                    price: 1000000
                },
                {
                    id: 2,
                    studentName: 'Trần Thị B',
                    courseName: 'Lập trình Node.js nâng cao',
                    enrollmentDate: '2024-03-14',
                    price: 2000000
                }
            ]);
        } catch (error) {
            console.error('Error fetching statistics:', error);
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

            <Card
                title="Đăng ký gần đây"
                style={{ marginTop: 16 }}
            >
                <Table
                    columns={columns}
                    dataSource={recentEnrollments}
                    rowKey="id"
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default Statistics; 
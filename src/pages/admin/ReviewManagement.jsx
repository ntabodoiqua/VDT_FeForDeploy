import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Typography, Divider, Card, Select, Rate, Tag } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Mock data - replace with API calls later
const mockCoursesWithReviews = [
    {
        id: 'course1',
        name: 'Khóa học ReactJS Cơ bản',
        instructor: 'Nguyễn Văn A',
        reviews: [
            { id: 'rev1', studentName: 'Trần Thị B', studentAvatar: 'https://i.pravatar.cc/150?u=stud1', rating: 5, comment: 'Khóa học rất hay và dễ hiểu!', status: 'approved', date: '2023-10-26' },
            { id: 'rev2', studentName: 'Lê Văn C', studentAvatar: 'https://i.pravatar.cc/150?u=stud2', rating: 4, comment: 'Nội dung tốt, giảng viên nhiệt tình.', status: 'approved', date: '2023-10-25' },
        ],
        pendingReviews: [
            { id: 'prev1', studentName: 'Phạm Thị D', studentAvatar: 'https://i.pravatar.cc/150?u=pend1', rating: 5, comment: 'Tuyệt vời, mong có thêm khóa học nâng cao.', reason: 'Chờ duyệt', date: '2023-10-27' },
        ]
    },
    {
        id: 'course2',
        name: 'Node.js Nâng cao',
        instructor: 'Nguyễn Thị E',
        reviews: [
            { id: 'rev3', studentName: 'Vũ Văn F', studentAvatar: 'https://i.pravatar.cc/150?u=stud3', rating: 3, comment: 'Khá ổn, nhưng cần thêm ví dụ thực tế.', status: 'approved', date: '2023-11-01' },
        ],
        pendingReviews: []
    },
    {
        id: 'course3',
        name: 'Quản lý dự án Agile',
        instructor: 'Hoàng Văn G',
        reviews: [],
        pendingReviews: [
            { id: 'prev2', studentName: 'Đặng Thị H', studentAvatar: 'https://i.pravatar.cc/150?u=pend2', rating: 4, comment: 'Nội dung bao quát, hữu ích.', reason: 'Chờ duyệt', date: '2023-11-05' },
            { id: 'prev3', studentName: 'Lý Văn I', studentAvatar: 'https://i.pravatar.cc/150?u=pend3', rating: 5, comment: 'Rất hài lòng với khóa học này!', reason: 'Đã gửi đánh giá', date: '2023-11-03' },
        ]
    },
];

const ReviewManagement = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courses, setCourses] = useState([]); // Will be fetched from API

    useEffect(() => {
        // Simulate API call
        setCourses(mockCoursesWithReviews);
        if (mockCoursesWithReviews.length > 0) {
            // setSelectedCourse(mockCoursesWithReviews[0]); // Auto-select first course
        }
    }, []);

    const handleCourseSelect = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        setSelectedCourse(course);
    };

    const approveReview = (reviewId) => {
        console.log(`Approving review ${reviewId} for course ${selectedCourse?.id}`);
        setSelectedCourse(prev => ({
            ...prev,
            reviews: [...prev.reviews, { ...prev.pendingReviews.find(r => r.id === reviewId), status: 'approved' }],
            pendingReviews: prev.pendingReviews.filter(r => r.id !== reviewId)
        }));
    };

    const rejectReview = (reviewId) => {
        console.log(`Rejecting review ${reviewId} for course ${selectedCourse?.id}`);
        setSelectedCourse(prev => ({
            ...prev,
            pendingReviews: prev.pendingReviews.filter(r => r.id !== reviewId)
        }));
    };

    const renderReviewList = (reviewList, isPending = false) => {
        if (reviewList.length === 0) {
            return <Text>{isPending ? 'Không có nhận xét nào đang chờ duyệt.' : 'Chưa có nhận xét nào cho khóa học này.'}</Text>;
        }
        return (
            <List
                itemLayout="vertical"
                dataSource={reviewList}
                renderItem={item => (
                    <List.Item
                        key={item.id}
                        actions={isPending ? [
                            <Button type="primary" size="small" onClick={() => approveReview(item.id)}>Duyệt</Button>,
                            <Button type="default" danger size="small" onClick={() => rejectReview(item.id)}>Từ chối</Button>
                        ] : null}
                        extra={!isPending && <Tag color={item.status === 'approved' ? 'green' : 'orange'}>{item.status}</Tag>}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.studentAvatar || `https://i.pravatar.cc/150?u=${item.id}`} />}
                            title={<>{item.studentName} <Text type="secondary" style={{fontSize: '0.85em'}}>- {item.date}</Text></>}
                            description={<Rate disabled defaultValue={item.rating} style={{fontSize: 14}}/>}
                        />
                        <Paragraph>{item.comment}</Paragraph>
                        {isPending && item.reason && <Text type="secondary">Lý do: {item.reason}</Text>}
                    </List.Item>
                )}
            />
        );
    };

    return (
        <div style={{ padding: '20px' }}>
            <Title level={3}>Quản lý Nhận xét Khóa học</Title>
            <Text>Chọn một khóa học để xem và duyệt nhận xét.</Text>

            <Select
                style={{ width: '100%', marginBottom: '20px', marginTop: '10px' }}
                placeholder="Chọn khóa học"
                onChange={handleCourseSelect}
                value={selectedCourse?.id}
            >
                {courses.map(course => (
                    <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
            </Select>

            {selectedCourse && (
                <Card title={`Nhận xét cho khóa học: ${selectedCourse.name}`}>
                    <Text strong>Giảng viên:</Text> <Text>{selectedCourse.instructor}</Text>
                    <Divider />

                    <Title level={4}>Nhận xét đã duyệt ({selectedCourse.reviews.length})</Title>
                    {renderReviewList(selectedCourse.reviews)}

                    <Divider />
                    <Title level={4}>Nhận xét chờ duyệt ({selectedCourse.pendingReviews.length})</Title>
                    {renderReviewList(selectedCourse.pendingReviews, true)}
                </Card>
            )}
        </div>
    );
};

export default ReviewManagement; 
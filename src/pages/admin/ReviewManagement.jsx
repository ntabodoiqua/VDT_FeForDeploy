import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Button, Typography, Divider, Card, Select, Rate, Tag, Spin, Alert, message } from 'antd';
import { fetchCoursesApi, fetchPendingReviewsApi, fetchApprovedReviewsApi, approveReviewApi, rejectReviewApi } from '../../util/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    // The path from DB might have spaces, encodeURI will handle them to be valid URL.
    return encodeURI(`${BASE_URL}/lms${relativePath}`);
};

const ReviewManagement = () => {
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [courses, setCourses] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [approvedReviews, setApprovedReviews] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    
    const [approvedPagination, setApprovedPagination] = useState({ current: 1, pageSize: 5, total: 0 });
    const [pendingPagination, setPendingPagination] = useState({ current: 1, pageSize: 5, total: 0 });

    const [coursesLoading, setCoursesLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getCourses = async () => {
            setCoursesLoading(true);
            setError(null);
            try {
                const response = await fetchCoursesApi({ page: 0, size: 100 });
                if (response && response.result && response.result.content) {
                    setCourses(response.result.content);
                } else {
                    setCourses([]);
                }
            } catch (err) {
                setError('Không thể tải danh sách khóa học.');
                console.error(err);
            } finally {
                setCoursesLoading(false);
            }
        };
        getCourses();
    }, []);

    const fetchApprovedReviews = useCallback(async (page, pageSize) => {
        if (!selectedCourseId) return;
        setActionLoading(true);
        try {
            const params = { page: page - 1, size: pageSize };
            const response = await fetchApprovedReviewsApi(selectedCourseId, params);
            if (response?.result) {
                setApprovedReviews(response.result.content || []);
                setApprovedPagination({ current: page, pageSize, total: response.result.totalElements || 0 });
            } else {
                setApprovedReviews([]);
                setApprovedPagination({ current: page, pageSize, total: 0 });
            }
        } catch (err) {
            setError('Không thể tải nhận xét đã duyệt.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    }, [selectedCourseId]);

    const fetchPendingReviews = useCallback(async (page, pageSize) => {
        if (!selectedCourseId) return;
        setActionLoading(true);
        try {
            const params = { page: page - 1, size: pageSize };
            const response = await fetchPendingReviewsApi(selectedCourseId, params);
            if (response?.result) {
                setPendingReviews(response.result.content || []);
                setPendingPagination({ current: page, pageSize, total: response.result.totalElements || 0 });
            } else {
                setPendingReviews([]);
                setPendingPagination({ current: page, pageSize, total: 0 });
            }
        } catch (err) {
            setError('Không thể tải nhận xét chờ duyệt.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        if (selectedCourseId) {
            setDetailsLoading(true);
            const courseDetails = courses.find(c => c.id === selectedCourseId);
            setCourseInfo(courseDetails);
            
            Promise.all([
                fetchApprovedReviews(1, 5),
                fetchPendingReviews(1, 5)
            ]).finally(() => {
                setDetailsLoading(false);
            });
        }
    }, [selectedCourseId, courses, fetchApprovedReviews, fetchPendingReviews]);


    const handleCourseSelect = (courseId) => {
        setSelectedCourseId(courseId);
    };

    const handleAction = async (action, reviewId) => {
        setActionLoading(true);
        try {
            if (action === 'approve') {
                await approveReviewApi(reviewId);
                message.success('Đã duyệt nhận xét.');
            } else { // reject
                await rejectReviewApi(reviewId);
                message.info('Đã từ chối nhận xét.');
            }
            // Refetch data for current pages
            await Promise.all([
                fetchApprovedReviews(approvedPagination.current, approvedPagination.pageSize),
                fetchPendingReviews(pendingPagination.current, pendingPagination.pageSize)
            ]);
        } catch (err) {
            console.error(err);
            message.error('Đã có lỗi xảy ra.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderReviewList = (reviewList, pagination, onPageChange, isPending = false) => {
        if (detailsLoading) {
            return <Spin />;
        }
        if (!reviewList || reviewList.length === 0) {
            return <Text>{isPending ? 'Không có nhận xét nào đang chờ duyệt.' : 'Chưa có nhận xét nào cho khóa học này.'}</Text>;
        }
        return (
            <List
                loading={actionLoading}
                itemLayout="vertical"
                dataSource={reviewList}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    pageSizeOptions: ['5', '10', '15'],
                    showSizeChanger: true,
                    onChange: onPageChange,
                }}
                renderItem={item => (
                    <List.Item
                        key={item.id}
                        actions={isPending ? [
                            <Button type="primary" size="small" onClick={() => handleAction('approve', item.id)}>Duyệt</Button>,
                            <Button type="default" danger size="small" onClick={() => handleAction('reject', item.id)}>Từ chối</Button>
                        ] : null}
                        extra={!isPending ? (item.rejected ? <Tag color="red">Đã từ chối</Tag> : <Tag color="green">Đã duyệt</Tag>) : null}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={getFullImageUrl(item.student?.avatarUrl) || `https://i.pravatar.cc/150?u=${item.student?.id}`} />}
                            title={<>{`${item.student?.firstName} ${item.student?.lastName}`} <Text type="secondary" style={{fontSize: '0.85em'}}>- {new Date(item.reviewDate).toLocaleDateString()}</Text></>}
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

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Select
                showSearch
                style={{ width: '100%', marginBottom: '20px', marginTop: '10px' }}
                placeholder="Chọn hoặc tìm kiếm khóa học"
                onChange={handleCourseSelect}
                value={selectedCourseId}
                loading={coursesLoading}
                filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
            >
                {courses.map(course => (
                    <Option key={course.id} value={course.id}>{course.title}</Option>
                ))}
            </Select>

            {selectedCourseId && courseInfo && (
                <Card title={`Nhận xét cho khóa học: ${courseInfo.title}`}>
                    {courseInfo.instructor ? (
                        <div>
                            <Text strong>Giảng viên:</Text>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
                                <Avatar src={getFullImageUrl(courseInfo.instructor.avatarUrl) || `https://i.pravatar.cc/150?u=${courseInfo.instructor.id}`} size={64} />
                                <div style={{ marginLeft: '15px' }}>
                                    <Text strong style={{ fontSize: '16px' }}>{`${courseInfo.instructor.firstName} ${courseInfo.instructor.lastName}`}</Text>
                                    <br />
                                    <Text type="secondary">Email: {courseInfo.instructor.email || 'Chưa cập nhật'}</Text>
                                    <br />
                                    <Text type="secondary">SĐT: {courseInfo.instructor.phone || 'Chưa cập nhật'}</Text>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p><Text strong>Giảng viên:</Text> {courseInfo.createdBy || 'N/A'}</p>
                    )}
                    <Divider />

                    <Title level={4}>Nhận xét đã xử lý ({approvedPagination.total})</Title>
                    {renderReviewList(approvedReviews, approvedPagination, (page, pageSize) => fetchApprovedReviews(page, pageSize))}

                    <Divider />
                    <Title level={4}>Nhận xét chờ duyệt ({pendingPagination.total})</Title>
                    {renderReviewList(pendingReviews, pendingPagination, (page, pageSize) => fetchPendingReviews(page, pageSize), true)}
                </Card>
            )}
        </div>
    );
};

export default ReviewManagement; 
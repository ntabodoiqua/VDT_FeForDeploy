import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Button, Progress, Typography, Divider, Card, Select, Spin, Alert, Row, Col, message } from 'antd';
import { fetchCoursesApi, fetchPendingEnrollmentsApi, fetchApprovedEnrollmentsApi, approveEnrollmentApi, rejectEnrollmentApi } from '../../util/api';

const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    // The path from DB might have spaces, encodeURI will handle them to be valid URL.
    return encodeURI(`${BASE_URL}/lms${relativePath}`);
};

const EnrollmentManagement = () => {
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [courses, setCourses] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    
    const [approvedPagination, setApprovedPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [pendingPagination, setPendingPagination] = useState({ current: 1, pageSize: 10, total: 0 });

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

    const fetchDetails = useCallback(async () => {
        if (!selectedCourseId) return;

        setDetailsLoading(true);
        setError(null);

        try {
            const approvedParams = { page: approvedPagination.current - 1, size: approvedPagination.pageSize };
            const pendingParams = { page: pendingPagination.current - 1, size: pendingPagination.pageSize };

            const [pendingRes, approvedRes] = await Promise.all([
                fetchPendingEnrollmentsApi(selectedCourseId, pendingParams),
                fetchApprovedEnrollmentsApi(selectedCourseId, approvedParams)
            ]);

            let courseData = null;

            if (approvedRes?.result) {
                setEnrolledStudents(approvedRes.result.content);
                setApprovedPagination(prev => ({ ...prev, total: approvedRes.result.totalElements }));
                if (approvedRes.result.content.length > 0) {
                    courseData = approvedRes.result.content[0].course;
                }
            }

            if (pendingRes?.result) {
                setPendingStudents(pendingRes.result.content);
                setPendingPagination(prev => ({ ...prev, total: pendingRes.result.totalElements }));
                if (!courseData && pendingRes.result.content.length > 0) {
                    courseData = pendingRes.result.content[0].course;
                }
            }
            
            if (courseData) {
                setCourseInfo(courseData);
            } else {
                const selectedCourseFromList = courses.find(c => c.id === selectedCourseId);
                setCourseInfo(selectedCourseFromList);
            }

        } catch (err) {
            setError(err.message || 'Không thể tải chi tiết ghi danh cho khóa học.');
            console.error(err);
            setCourseInfo(null);
        } finally {
            setDetailsLoading(false);
        }
    }, [selectedCourseId, courses, approvedPagination.current, approvedPagination.pageSize, pendingPagination.current, pendingPagination.pageSize]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);


    const handleCourseSelect = (courseId) => {
        setSelectedCourseId(courseId);
        setApprovedPagination({ current: 1, pageSize: 10, total: 0 });
        setPendingPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const handleAction = async (action, enrollmentId, studentName) => {
        setActionLoading(true);
        try {
            let response;
            if (action === 'approve') {
                response = await approveEnrollmentApi(enrollmentId);
                message.success(`Đã duyệt sinh viên ${studentName}`);
            } else { // reject
                response = await rejectEnrollmentApi(enrollmentId);
                message.info(`Đã từ chối sinh viên ${studentName}`);
            }
            fetchDetails(); // Refetch data to update lists and totals
        } catch (err) {
            console.error(err);
            message.error(`Đã có lỗi xảy ra. Vui lòng thử lại.`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Title level={3}>Quản lý Ghi danh</Title>
            <Text>Chọn một khóa học để xem chi tiết ghi danh.</Text>

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

            {detailsLoading && <Spin tip="Đang tải chi tiết..." size="large"><div style={{height: '300px'}}/></Spin>}

            {!detailsLoading && courseInfo && (
                <Card title={`Chi tiết Ghi danh cho: ${courseInfo.title}`}>
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
                    <Row gutter={16}>
                        <Col span={12}>
                            <Title level={4}>Học viên đã tham gia ({approvedPagination.total})</Title>
                            {enrolledStudents.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={enrolledStudents}
                                    pagination={{
                                        current: approvedPagination.current,
                                        pageSize: approvedPagination.pageSize,
                                        total: approvedPagination.total,
                                        pageSizeOptions: ['5', '10', '15', '20'],
                                        showSizeChanger: true,
                                        onChange: (page, pageSize) => {
                                            setApprovedPagination({ ...approvedPagination, current: page, pageSize: pageSize });
                                        }
                                    }}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar src={getFullImageUrl(item.student?.avatarUrl) || `https://i.pravatar.cc/150?u=${item.student?.id}`} />}
                                                title={`${item.student?.firstName} ${item.student?.lastName}`}
                                                description={<>
                                                    <Text type="secondary">Username: {item.student?.username}</Text><br />
                                                    <Text type="secondary">SĐT: {item.student?.phone || 'Chưa cập nhật'}</Text><br />
                                                    <Text type="secondary">Ngày tham gia: {new Date(item.enrollmentDate).toLocaleDateString()}</Text>
                                                </>}
                                            />
                                            <div style={{ width: '150px' }}>
                                                <Text>Tiến độ: </Text>
                                                <Progress percent={Math.round(item.progress * 100)} size="small" />
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Text>Chưa có học viên nào trong khóa học này.</Text>
                            )}
                        </Col>
                        <Col span={12}>
                            <Title level={4}>Học viên chờ duyệt ({pendingPagination.total})</Title>
                            {pendingStudents.length > 0 ? (
                                <List
                                    loading={actionLoading}
                                    itemLayout="horizontal"
                                    dataSource={pendingStudents}
                                    pagination={{
                                        current: pendingPagination.current,
                                        pageSize: pendingPagination.pageSize,
                                        total: pendingPagination.total,
                                        pageSizeOptions: ['5', '10', '15', '20'],
                                        showSizeChanger: true,
                                        onChange: (page, pageSize) => {
                                            setPendingPagination({ ...pendingPagination, current: page, pageSize: pageSize });
                                        }
                                    }}
                                    renderItem={item => {
                                        const studentName = `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.trim();
                                        return (
                                            <List.Item
                                                actions={[
                                                    <Button type="primary" size="small" onClick={() => handleAction('approve', item.id, studentName)}>Duyệt</Button>,
                                                    <Button type="default" danger size="small" onClick={() => handleAction('reject', item.id, studentName)}>Từ chối</Button>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    avatar={<Avatar src={getFullImageUrl(item.student?.avatarUrl) || `https://i.pravatar.cc/150?u=${item.student?.id}`} />}
                                                    title={studentName}
                                                    description={<>
                                                        <Text type="secondary">Username: {item.student?.username}</Text><br />
                                                        <Text type="secondary">SĐT: {item.student?.phone || 'Chưa cập nhật'}</Text><br />
                                                        <Text type="secondary">Ngày đăng ký: {new Date(item.enrollmentDate).toLocaleDateString()}</Text>
                                                    </>}
                                                />
                                            </List.Item>
                                        )
                                    }}
                                />
                            ) : (
                                <Text>Không có học viên nào đang chờ duyệt.</Text>
                            )}
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
};

export default EnrollmentManagement; 
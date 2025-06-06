import React, { useState, useEffect, useCallback, useContext } from 'react';
import { List, Avatar, Button, Progress, Typography, Divider, Card, Select, Spin, Alert, Row, Col, message, Modal, Tag } from 'antd';
import { fetchCoursesApi, fetchPendingEnrollmentsApi, fetchApprovedEnrollmentsApi, approveEnrollmentApi, rejectEnrollmentApi, fetchEnrollmentProgressApi, fetchLessonsForCourseApi, fetchLessonByIdApi } from '../../util/api';
import { AuthContext } from '../../components/context/auth.context';

const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    // The path from DB might have spaces, encodeURI will handle them to be valid URL.
    return encodeURI(`${BASE_URL}/lms${relativePath}`);
};

const InstructorEnrollmentManagement = () => {
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [courses, setCourses] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    
    const [approvedPagination, setApprovedPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [pendingPagination, setPendingPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [coursesLoading, setCoursesLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for progress modal
    const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [courseLessons, setCourseLessons] = useState([]);
    const [studentProgress, setStudentProgress] = useState([]);
    const [progressLoading, setProgressLoading] = useState(false);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (!auth.username) return;

        const getCourses = async () => {
            setCoursesLoading(true);
            setError(null);
            try {
                // Filter courses by instructorName, similar to CourseManagement.jsx
                const response = await fetchCoursesApi({ page: 0, size: 1000, instructorName: auth.username });
                if (response && response.result && response.result.content) {
                    setCourses(response.result.content);
                } else {
                    setCourses([]);
                }
            } catch (err) {
                setError('Không thể tải danh sách khóa học của bạn.');
                console.error(err);
            } finally {
                setCoursesLoading(false);
            }
        };
        getCourses();
    }, [auth.username]);

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

    const handleViewProgress = async (enrollment) => {
        if (!enrollment || !enrollment.student) return;

        setSelectedStudent(enrollment.student);
        setIsProgressModalVisible(true);
        setProgressLoading(true);

        try {
            const [lessonsRes, progressRes] = await Promise.all([
                fetchLessonsForCourseApi(selectedCourseId, { page: 0, size: 1000 }), // Assuming max 1000 lessons
                fetchEnrollmentProgressApi(enrollment.id)
            ]);

            if (progressRes?.result) {
                setStudentProgress(progressRes.result);
            } else {
                setStudentProgress([]);
            }

            let lessonsWithDetails = [];
            if (lessonsRes?.result?.content) {
                lessonsWithDetails = await Promise.all(
                    lessonsRes.result.content.map(async (courseLesson) => {
                        if (courseLesson.lesson && courseLesson.lesson.id) {
                            try {
                                const lessonDetailsRes = await fetchLessonByIdApi(courseLesson.lesson.id);
                                if (lessonDetailsRes?.result) {
                                    // Replace the partial lesson object with the full one
                                    return { ...courseLesson, lesson: lessonDetailsRes.result };
                                }
                            } catch (e) {
                                console.error(`Failed to fetch details for lesson ${courseLesson.lesson.id}`, e);
                            }
                        }
                        return courseLesson; // Return original if fetch fails or no id
                    })
                );
            }
            setCourseLessons(lessonsWithDetails);

        } catch (err) {
            console.error(err);
            message.error("Không thể tải tiến độ của học viên.");
            setCourseLessons([]);
            setStudentProgress([]);
        } finally {
            setProgressLoading(false);
        }
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
            <Text>Chọn một khóa học của bạn để xem chi tiết ghi danh.</Text>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Select
                showSearch
                style={{ width: '100%', marginBottom: '20px', marginTop: '10px' }}
                placeholder="Chọn hoặc tìm kiếm trong các khóa học của bạn"
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
                                        <List.Item
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleViewProgress(item)}
                                        >
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
            
            <Modal
                title={`Tiến độ học tập của ${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`}
                visible={isProgressModalVisible}
                onCancel={() => setIsProgressModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsProgressModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width={800}
            >
                {progressLoading ? (
                    <Spin tip="Đang tải tiến độ..." />
                ) : (
                    <List
                        dataSource={courseLessons}
                        renderItem={lessonItem => {
                            const lessonDetail = lessonItem.lesson || {};
                            const progress = studentProgress.find(p => p.lessonId === lessonDetail.id);
                            const isCompleted = progress?.completed || false;
                            const description = lessonDetail.content || 'Không có mô tả';
                            const truncatedDescription = description.length > 150 ? `${description.substring(0, 150)}...` : description;
                            return (
                                <List.Item>
                                    <List.Item.Meta
                                        title={lessonDetail.title}
                                        description={truncatedDescription}
                                    />
                                    <Tag color={isCompleted ? 'green' : 'red'}>
                                        {isCompleted ? `Hoàn thành (${new Date(progress.completionDate).toLocaleDateString()})` : 'Chưa hoàn thành'}
                                    </Tag>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default InstructorEnrollmentManagement; 
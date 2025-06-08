import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Progress,
    Button,
    Empty,
    Input,
    Select,
    Form,
    Spin,
    Tag,
    Typography,
    Pagination,
    Space,
    message,
    Rate
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlayCircleOutlined, SearchOutlined, ClearOutlined, BookOutlined, StarOutlined } from '@ant-design/icons';
import { fetchMyCoursesApi, fetchCategoriesApi } from '../../util/api';

const { Title, Text } = Typography;
const { Option } = Select;

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filterValues, setFilterValues] = useState({
        title: '',
        status: 'all',
        category: 'all',
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 8,
        total: 0
    });
    const [filterForm] = Form.useForm();
    const navigate = useNavigate();
    const [allEnrollments, setAllEnrollments] = useState([]); // Store all enrollments

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return 'https://via.placeholder.com/300x200';
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        return urlPath;
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetchCategoriesApi({ page: 0, size: 100 });
                if (res && res.result) {
                    setCategories(res.result.content.map(c => c.name));
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                message.error('Không thể tải danh mục.');
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchMyCourses = async () => {
            setLoading(true);

            const params = {
                page: pagination.current - 1,
                size: pagination.pageSize,
            };

            // Remove empty, null, or 'all' filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === 'all') {
                    delete params[key];
                }
            });

            try {
                const res = await fetchMyCoursesApi(params);
                if (res && res.result) {
                    // Map enrollment data to course data with enrollment info
                    const enrollmentsData = res.result.content.map(enrollment => ({
                        ...enrollment.course,
                        // Add enrollment-specific data
                        enrollmentId: enrollment.id,
                        enrollmentDate: enrollment.enrollmentDate,
                        isCompleted: enrollment.completed, // Fixed: use 'completed' instead of 'isCompleted'
                        completionDate: enrollment.completionDate,
                        progress: Math.round(enrollment.progress * 100), // Convert 0.0-1.0 to 0-100%
                        approvalStatus: enrollment.approvalStatus,
                        // Calculate completed lessons based on progress and total lessons
                        completedLessons: Math.round((enrollment.progress * enrollment.course.totalLessons) || 0)
                    }));

                    setAllEnrollments(enrollmentsData); // Store all data
                } else {
                    setCourses([]);
                    setPagination(prev => ({...prev, total: 0}));
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                message.error('Không thể tải khóa học của bạn.');
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCourses();
    }, []); // Only fetch once on component mount

    // Apply filtering when filter values change
    useEffect(() => {
        if (allEnrollments.length === 0) return;

        let filteredCourses = allEnrollments;

        // Filter by title
        if (filterValues.title) {
            filteredCourses = filteredCourses.filter(course =>
                course.title.toLowerCase().includes(filterValues.title.toLowerCase())
            );
        }

        // Filter by category
        if (filterValues.category && filterValues.category !== 'all') {
            filteredCourses = filteredCourses.filter(course =>
                course.category.name === filterValues.category
            );
        }

        // Filter by status
        if (filterValues.status && filterValues.status !== 'all') {
            filteredCourses = filteredCourses.filter(course => {
                switch (filterValues.status) {
                    case 'not-started':
                        return course.progress === 0;
                    case 'in-progress':
                        return course.progress > 0 && course.progress < 100;
                                                    case 'completed':
                                    return course.progress === 100 || course.isCompleted;
                    default:
                        return true;
                }
            });
        }

        // Apply pagination on filtered results
        const startIndex = (pagination.current - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

        setCourses(paginatedCourses);
        setPagination(prev => ({ ...prev, total: filteredCourses.length }));
    }, [allEnrollments, filterValues, pagination.current, pagination.pageSize]);

    const onApplyFilters = (values) => {
        setFilterValues(values);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
    };

    const onClearFilters = () => {
        filterForm.resetFields();
        const cleared = { title: '', status: 'all', category: 'all' };
        setFilterValues(cleared);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleContinueLearning = (courseId) => {
        navigate(`/student/learning/${courseId}`);
    };

    const handleRateCourse = (courseId) => {
        // Navigate to course rating page
        navigate(`/student/course-review/${courseId}`);
    };

    const handlePaginationChange = (page, pageSize) => {
        setPagination(prev => ({ ...prev, current: page, pageSize }));
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Đang tải khóa học của bạn...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}><BookOutlined style={{ marginRight: 8 }} />Khóa học của tôi</Title>
                <Text>Tiếp tục hành trình học tập và hoàn thành các mục tiêu của bạn.</Text>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form form={filterForm} layout="vertical" onFinish={onApplyFilters} initialValues={filterValues}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={9}>
                            <Form.Item name="title" label="Tìm kiếm khóa học">
                                <Input placeholder="Nhập tên khóa học" allowClear />
                            </Form.Item>
                        </Col>
                                                 <Col xs={24} sm={12} md={5}>
                            <Form.Item name="category" label="Danh mục">
                                <Select>
                                    <Option value="all">Tất cả</Option>
                                    {categories.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                                                 <Col xs={24} sm={12} md={5}>
                             <Form.Item name="status" label="Trạng thái">
                                 <Select>
                                     <Option value="all">Tất cả</Option>
                                     <Option value="not-started">Chưa bắt đầu</Option>
                                     <Option value="in-progress">Đang học</Option>
                                     <Option value="completed">Đã hoàn thành</Option>
                                 </Select>
                             </Form.Item>
                         </Col>
                         <Col xs={24} sm={12} md={3} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '24px' }}>
                             <Space>
                                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>Lọc</Button>
                                <Button onClick={onClearFilters} icon={<ClearOutlined />}>Xóa</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {courses.length === 0 ? (
                <Empty
                    description={
                        <span>
                            Không tìm thấy khóa học nào phù hợp.
                            <br />
                            Bạn chưa đăng ký khóa học nào?
                        </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={() => navigate('/student/course-list')}>
                        Khám phá khóa học
                    </Button>
                </Empty>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {courses.map(course => (
                            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                                <Card
                                    hoverable
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    cover={
                                        <img 
                                            alt={course.title} 
                                            src={getDisplayImageUrl(course.thumbnailUrl)} 
                                            style={{ height: 180, objectFit: 'cover' }} 
                                        />
                                    }
                                    actions={[
                                        <Button
                                            type="primary"
                                            icon={course.progress === 100 ? <StarOutlined /> : <PlayCircleOutlined />}
                                            onClick={() => course.progress === 100 ? handleRateCourse(course.id) : handleContinueLearning(course.id)}
                                            disabled={course.approvalStatus !== 'APPROVED'}
                                        >
                                            {course.approvalStatus === 'PENDING' ? 'Chờ duyệt' :
                                             course.approvalStatus === 'REJECTED' ? 'Bị từ chối' :
                                             course.progress === 100 ? 'Đánh giá khóa học' :
                                             course.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={<Title level={5} style={{ minHeight: 44, overflow: 'hidden' }}>{course.title}</Title>}
                                        description={
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                <div style={{ marginBottom: 8 }}>
                                                    <Tag color="blue">{course.category.name}</Tag>
                                                    {course.approvalStatus === 'PENDING' && <Tag color="orange">Chờ duyệt</Tag>}
                                                    {course.approvalStatus === 'REJECTED' && <Tag color="red">Bị từ chối</Tag>}
                                                </div>
                                                <Text type="secondary" style={{ marginBottom: 12 }}>
                                                    GV: {course.instructor.firstName} {course.instructor.lastName}
                                                </Text>
                                                
                                                <div style={{ marginTop: 'auto' }}>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <Progress
                                                            percent={course.progress}
                                                            status={course.progress === 100 ? 'success' : 'active'}
                                                            strokeColor={{ from: '#108ee9', to: '#87d068' }}
                                                        />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            Hoàn thành: {course.completedLessons}/{course.totalLessons} bài học
                                                        </Text>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <Rate disabled allowHalf defaultValue={course.averageRating || 0} style={{ fontSize: '14px' }} />
                                                        <Text type="secondary" style={{ marginLeft: 8 }}>
                                                            ({course.averageRating ? course.averageRating.toFixed(1) : 'Chưa có đánh giá'})
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    
                    {pagination.total > pagination.pageSize && (
                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                onChange={handlePaginationChange}
                                showSizeChanger
                                pageSizeOptions={['8', '12', '16', '20']}
                                showTotal={(total, range) => 
                                    `${range[0]}-${range[1]} của ${total} khóa học`
                                }
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyCourses; 
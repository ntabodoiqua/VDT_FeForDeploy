import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Select, message, Modal, Tag, Rate, Spin, List, Typography, Pagination, Divider, Form, DatePicker, Space, Image, Avatar, Descriptions, Statistic } from 'antd';
import { SearchOutlined, TrophyOutlined, EyeOutlined, BookOutlined, UserOutlined, ClockCircleOutlined, StarOutlined, InfoCircleOutlined, TeamOutlined, CrownOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { fetchTopInstructorsApi, fetchAllInstructorsApi, fetchInstructorByIdApi, fetchInstructorCoursesApi } from '../../util/api';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const InstructorList = () => {
    const [topInstructors, setTopInstructors] = useState([]);
    const [allInstructors, setAllInstructors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allInstructorsLoading, setAllInstructorsLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    
    // States for instructor preview modal
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewInstructor, setPreviewInstructor] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [instructorCourses, setInstructorCourses] = useState([]);

    // States for all instructors section
    const [allInstructorsFilterForm] = Form.useForm();
    const [allInstructorsFilterValues, setAllInstructorsFilterValues] = useState({
        name: undefined,
        experience: undefined,
        rating: undefined,
    });
    const [allInstructorsPagination, setAllInstructorsPagination] = useState({
        current: 1,
        pageSize: 12,
        total: 0
    });



    // Helper function to get full image URL
    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) {
            // Use a working placeholder or fallback image
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTIwIDkwSDgwTDEwMCA3MFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+';
        }
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }
        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        return urlPath; 
    };



    // API integration functions
    const fetchTopInstructors = async () => {
        setLoading(true);
        try {
            const response = await fetchTopInstructorsApi({ limit: 10 });
            // Response đã được unwrap bởi axios interceptor
            if (response && response.code === 1000) {
                const instructors = response.result;
                setTopInstructors(instructors);
                

            } else {
                message.error('Không thể tải danh sách giảng viên hàng đầu');
            }
        } catch (error) {
            console.error('Error fetching top instructors:', error);
            message.error('Không thể tải danh sách giảng viên: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllInstructors = async (page = 1, pageSize = 12, filtersToApply = allInstructorsFilterValues) => {
        console.log('🔍 fetchAllInstructors called with:', { page, pageSize, filtersToApply });
        setAllInstructorsLoading(true);
        try {
            const params = {
                page: page - 1, // Backend sử dụng 0-based pagination
                size: pageSize
                // Remove sort parameter as backend might not support it yet
            };

            // Apply filters
            if (filtersToApply.name && filtersToApply.name.trim()) {
                params.name = filtersToApply.name.trim();
            }
            if (filtersToApply.experience) {
                // Convert experience range to minimum years
                const experienceMap = {
                    '1-3': 1,
                    '3-5': 3,
                    '5-10': 5,
                    '10+': 10
                };
                params.minExperience = experienceMap[filtersToApply.experience];
            }
            if (filtersToApply.rating) {
                // Convert rating to minimum rating
                const ratingMap = {
                    '4+': 4.0,
                    '3+': 3.0,
                    '2+': 2.0
                };
                params.minRating = ratingMap[filtersToApply.rating];
            }

            console.log('API params being sent:', params);

            const response = await fetchAllInstructorsApi(params);
            // Response đã được unwrap bởi axios interceptor
            if (response && response.code === 1000) {
                const instructorPage = response.result;
                setAllInstructors(instructorPage.content);
                setAllInstructorsPagination({
                    current: page,
                    pageSize: pageSize,
                    total: instructorPage.totalElements
                });
            } else {
                message.error('Không thể tải danh sách giảng viên');
            }
        } catch (error) {
            console.error('Error fetching all instructors:', error);
            message.error('Không thể tải danh sách giảng viên: ' + (error.response?.data?.message || error.message));
        } finally {
            setAllInstructorsLoading(false);
        }
    };

    const fetchInstructorPreview = async (instructorId) => {
        setLoadingPreview(true);
        try {
            // Fetch instructor details
            const instructorResponse = await fetchInstructorByIdApi(instructorId);
            if (instructorResponse && instructorResponse.code === 1000) {
                const instructor = instructorResponse.result;
                setPreviewInstructor(instructor);
                
                // Fetch instructor courses
                try {
                    const coursesResponse = await fetchInstructorCoursesApi(instructorId, { 
                        page: 0, 
                        size: 10,
                        sort: 'createdAt,desc'
                    });
                    if (coursesResponse && coursesResponse.code === 1000) {
                        setInstructorCourses(coursesResponse.result.content || []);
                    }
                } catch (courseError) {
                    console.error('Error fetching instructor courses:', courseError);
                    setInstructorCourses([]);
                }
                
                setPreviewModalVisible(true);
            } else {
                message.error('Không thể tải thông tin giảng viên');
            }
        } catch (error) {
            console.error('Error fetching instructor preview:', error);
            message.error('Không thể tải thông tin giảng viên: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingPreview(false);
        }
    };

    useEffect(() => {
        fetchTopInstructors();
        fetchAllInstructors();
    }, []);

    // Effect to refetch all instructors when filters change
    // Auto-triggers for name, others require manual apply
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only auto-fetch if there are meaningful name filters (for search-as-you-type)
            // Other filters should only trigger via manual apply
            if (allInstructorsFilterValues.name && allInstructorsFilterValues.name.trim()) {
                console.log('Auto-triggering search for name:', allInstructorsFilterValues.name);
                fetchAllInstructors(1, allInstructorsPagination.pageSize, allInstructorsFilterValues);
            }
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [allInstructorsFilterValues.name]); // Only watch name changes for auto-trigger

    const handleSearch = (value) => {
        setSearchText(value);
    };



    const handlePreviewInstructor = (instructor) => {
        fetchInstructorPreview(instructor.id);
    };

    const handleContactInstructor = (instructor) => {
        message.info(`Tính năng liên hệ giảng viên ${instructor.firstName} ${instructor.lastName} sẽ được phát triển`);
    };

    // Handlers for all instructors section
    const onApplyAllInstructorsFilters = () => {
        const currentFilterFormValues = allInstructorsFilterForm.getFieldsValue();
        console.log('Manually applying filters:', currentFilterFormValues);
        
        // Update filter state and fetch data in one go
        // This prevents double API calls since we're passing the filters directly
        setAllInstructorsFilterValues(currentFilterFormValues);
        fetchAllInstructors(1, allInstructorsPagination.pageSize, currentFilterFormValues);
    };

    const onClearAllInstructorsFilters = () => {
        allInstructorsFilterForm.resetFields();
        const clearedFilters = {
            name: undefined,
            experience: undefined,
            rating: undefined,
        };
        console.log('Clearing all filters');
        
        // Update filter state and fetch data in one go
        setAllInstructorsFilterValues(clearedFilters);
        fetchAllInstructors(1, allInstructorsPagination.pageSize, clearedFilters);
    };

    const handleAllInstructorsPaginationChange = (page, pageSize) => {
        fetchAllInstructors(page, pageSize, allInstructorsFilterValues);
    };

    const filteredTopInstructors = topInstructors.filter(instructor => {
        const fullName = `${instructor.firstName} ${instructor.lastName}`;
        const matchesSearch = fullName.toLowerCase().includes(searchText.toLowerCase());
        return matchesSearch;
    });

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2><CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />Giảng viên hàng đầu</h2>
                <p>Khám phá những giảng viên xuất sắc nhất với đánh giá cao và kinh nghiệm phong phú</p>
            </div>

            <div style={{ marginBottom: 24 }}>
                <Search
                    placeholder="Tìm kiếm giảng viên..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>Đang tải danh sách giảng viên hàng đầu...</p>
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {filteredTopInstructors.map((instructor, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={instructor.id}>
                            <Card
                                hoverable
                                style={{ height: '100%' }}
                                cover={
                                    <div style={{ position: 'relative', textAlign: 'center', padding: '20px' }}>
                                        <Avatar
                                            size={120}
                                            src={getDisplayImageUrl(instructor.avatarUrl)}
                                            icon={<UserOutlined />}
                                            style={{ border: '4px solid #1890ff' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            background: '#faad14',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            #{index + 1} Hàng đầu
                                        </div>
                                    </div>
                                }
                                actions={[
                                    <Button
                                        type="default"
                                        icon={<InfoCircleOutlined />}
                                        onClick={() => handlePreviewInstructor(instructor)}
                                        style={{ marginRight: 8 }}
                                        loading={loadingPreview}
                                    >
                                        Xem chi tiết
                                    </Button>,
                                    <Button
                                        type="primary"
                                        icon={<MailOutlined />}
                                        onClick={() => handleContactInstructor(instructor)}
                                    >
                                        Liên hệ
                                    </Button>
                                ]}
                            >
                                <Card.Meta
                                    title={
                                        <div style={{ textAlign: 'center' }}>
                                                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>
                                            {instructor.firstName} {instructor.lastName}
                                        </div>
                                            {instructor.achievements && instructor.achievements.length > 0 && (
                                                <Tag color="gold" style={{ marginTop: 4 }}>
                                                    <TrophyOutlined /> Đạt thành tích
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                    description={
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ marginBottom: 12, minHeight: 40, overflow: 'hidden' }}>
                                                {instructor.bio}
                                            </p>
                                            
                                            <Row gutter={16} style={{ marginBottom: 12 }}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Học viên"
                                                        value={instructor.totalStudents || 0}
                                                        prefix={<TeamOutlined />}
                                                        valueStyle={{ fontSize: '16px' }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Khóa học"
                                                        value={instructor.totalCourses || 0}
                                                        prefix={<BookOutlined />}
                                                        valueStyle={{ fontSize: '16px' }}
                                                    />
                                                </Col>
                                            </Row>

                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                                <Rate disabled defaultValue={instructor.averageRating || 0} style={{ fontSize: '14px' }} />
                                                <span style={{ fontSize: '14px', marginLeft: 8 }}>
                                                    {(instructor.averageRating || 0).toFixed(1)}/5 ({instructor.totalReviews || 0} đánh giá)
                                                </span>
                                            </div>

                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                ⭐ {instructor.experienceYears || 0} năm kinh nghiệm
                                            </Text>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {filteredTopInstructors.length === 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <p>Không tìm thấy giảng viên nào phù hợp với tiêu chí tìm kiếm.</p>
                </div>
            )}

            {/* Divider between top instructors and all instructors */}
            <Divider style={{ margin: '48px 0' }} />

            {/* All Instructors Section */}
            <div style={{ marginBottom: 24 }}>
                <h2><TeamOutlined style={{ color: '#52c41a', marginRight: 8 }} />Toàn bộ giảng viên</h2>
                <p>Khám phá tất cả các giảng viên có sẵn trong hệ thống</p>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Form 
                    form={allInstructorsFilterForm} 
                    layout="vertical" 
                    onFinish={onApplyAllInstructorsFilters}
                    onValuesChange={(changedValues, allValues) => {
                        // Only auto-trigger for name changes (search-as-you-type)
                        if (changedValues.name !== undefined) {
                            console.log('Name field changed, auto-updating filters:', allValues);
                            setAllInstructorsFilterValues(allValues);
                        }
                        // Other fields require manual apply button click
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="name" label="Tên giảng viên">
                                <Input placeholder="Nhập tên giảng viên" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="experience" label="Kinh nghiệm">
                                <Select placeholder="Chọn mức kinh nghiệm" allowClear>
                                    <Option value="1-3">1-3 năm</Option>
                                    <Option value="3-5">3-5 năm</Option>
                                    <Option value="5-10">5-10 năm</Option>
                                    <Option value="10+">Hơn 10 năm</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item name="rating" label="Đánh giá">
                                <Select placeholder="Chọn mức đánh giá" allowClear>
                                    <Option value="4+">4+ sao</Option>
                                    <Option value="3+">3+ sao</Option>
                                    <Option value="2+">2+ sao</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24}>
                            <div style={{ paddingTop: '30px' }}>
                                <Space>
                                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                                        Tìm kiếm
                                    </Button>
                                    <Button onClick={onClearAllInstructorsFilters} icon={<UserOutlined />}>
                                        Xóa bộ lọc
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {allInstructorsLoading ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16 }}>Đang tải toàn bộ giảng viên...</p>
                </div>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {allInstructors.map((instructor) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={instructor.id}>
                                <Card
                                    hoverable
                                    style={{ height: '100%' }}
                                    cover={
                                        <div style={{ position: 'relative', textAlign: 'center', padding: '20px' }}>
                                            <Avatar
                                                size={100}
                                                src={getDisplayImageUrl(instructor.avatarUrl)}
                                                icon={<UserOutlined />}
                                                style={{ border: '3px solid #1890ff' }}
                                            />
                                        </div>
                                    }
                                    actions={[
                                        <Button
                                            type="default"
                                            icon={<InfoCircleOutlined />}
                                            onClick={() => handlePreviewInstructor(instructor)}
                                            style={{ marginRight: 8 }}
                                            loading={loadingPreview}
                                        >
                                            Chi tiết
                                        </Button>,
                                        <Button
                                            type="primary"
                                            icon={<MailOutlined />}
                                            onClick={() => handleContactInstructor(instructor)}
                                        >
                                            Liên hệ
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta
                                        title={
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 8 }}>
                                                    {instructor.firstName} {instructor.lastName}
                                                </div>
                                            </div>
                                        }
                                        description={
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ marginBottom: 12, minHeight: 40, overflow: 'hidden' }}>
                                                    {instructor.bio}
                                                </p>
                                                
                                                <Row gutter={8} style={{ marginBottom: 12 }}>
                                                    <Col span={12}>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            <TeamOutlined /> {instructor.totalStudents || 0}
                                                        </Text>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            <BookOutlined /> {instructor.totalCourses || 0}
                                                        </Text>
                                                    </Col>
                                                </Row>

                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                                    <Rate disabled defaultValue={instructor.averageRating || 0} style={{ fontSize: '12px' }} />
                                                    <span style={{ fontSize: '12px', marginLeft: 4 }}>
                                                        ({(instructor.averageRating || 0).toFixed(1)}/5)
                                                    </span>
                                                </div>

                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {instructor.experienceYears || 0} năm kinh nghiệm
                                                </Text>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination for all instructors */}
                    {allInstructorsPagination.total > 0 && (
                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <Pagination
                                current={allInstructorsPagination.current}
                                pageSize={allInstructorsPagination.pageSize}
                                total={allInstructorsPagination.total}
                                onChange={handleAllInstructorsPaginationChange}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total, range) => 
                                    `${range[0]}-${range[1]} của ${total} giảng viên`
                                }
                                pageSizeOptions={['12', '24', '36', '48']}
                            />
                        </div>
                    )}

                    {allInstructors.length === 0 && !allInstructorsLoading && (
                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <p>Không tìm thấy giảng viên nào phù hợp với tiêu chí tìm kiếm.</p>
                        </div>
                    )}
                </>
            )}

            {/* Instructor Preview Modal */}
            <Modal
                title={null}
                open={previewModalVisible}
                onCancel={() => {
                    setPreviewModalVisible(false);
                    setPreviewInstructor(null);
                    setInstructorCourses([]);
                }}
                footer={null}
                width={900}
                style={{ top: 20 }}
                styles={{ body: { padding: 0 } }}
            >
                {loadingPreview ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, fontSize: '16px' }}>Đang tải thông tin giảng viên...</p>
                    </div>
                ) : previewInstructor ? (
                    <div>
                        {/* Instructor Header */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '32px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Background Pattern */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.3
                            }}></div>
                            
                            <Row gutter={24} style={{ position: 'relative', zIndex: 1 }}>
                                <Col span={16}>
                                    <div>
                                        <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
                                            {previewInstructor.firstName} {previewInstructor.lastName}
                                        </Title>
                                        <p style={{ fontSize: '16px', marginBottom: 16, opacity: 0.9 }}>
                                            {previewInstructor.bio}
                                        </p>
                                        
                                        {/* Instructor Stats */}
                                        <Row gutter={24}>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {previewInstructor.totalStudents || 0}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Học viên</div>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {(previewInstructor.averageRating || 0).toFixed(1)}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Đánh giá</div>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                                        {previewInstructor.experienceYears || 0}
                                                    </div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Năm KN</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Avatar
                                            size={150}
                                            src={getDisplayImageUrl(previewInstructor.avatarUrl)}
                                            icon={<UserOutlined />}
                                            style={{
                                                border: '4px solid rgba(255,255,255,0.3)'
                                            }}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Instructor Content */}
                        <div style={{ padding: '32px' }}>
                            <Row gutter={32}>
                                {/* Left Column - Instructor Details */}
                                <Col span={14}>
                                    <div style={{ marginBottom: 32 }}>
                                        <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                                            <UserOutlined style={{ marginRight: 8 }} />
                                            Thông tin giảng viên
                                        </Title>
                                        <Descriptions bordered size="small" column={1}>
                                            <Descriptions.Item label="Họ và tên">
                                                {previewInstructor.firstName} {previewInstructor.lastName}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Email">
                                                <a href={`mailto:${previewInstructor.email}`}>
                                                    {previewInstructor.email}
                                                </a>
                                            </Descriptions.Item>

                                            <Descriptions.Item label="Kinh nghiệm">
                                                {previewInstructor.experienceYears || 0} năm
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Đánh giá">
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Rate disabled defaultValue={previewInstructor.averageRating || 0} style={{ fontSize: '14px', marginRight: 8 }} />
                                                    <span>
                                                        {(previewInstructor.averageRating || 0).toFixed(1)}/5 
                                                        ({previewInstructor.totalReviews || 0} đánh giá)
                                                    </span>
                                                </div>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Thành tích">
                                                {previewInstructor.achievements && previewInstructor.achievements.length > 0 ? (
                                                    previewInstructor.achievements.map((achievement, index) => (
                                                        <Tag key={index} color="gold" style={{ marginBottom: 4 }}>
                                                            <TrophyOutlined /> {achievement}
                                                        </Tag>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#999' }}>Chưa có thành tích đặc biệt</span>
                                                )}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </div>

                                    {/* Instructor Courses */}
                                    <div>
                                        <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                                            <BookOutlined style={{ marginRight: 8 }} />
                                            Khóa học của giảng viên
                                        </Title>
                                        {instructorCourses.length > 0 ? (
                                            <List
                                                size="small"
                                                dataSource={instructorCourses}
                                                renderItem={(course) => (
                                                    <List.Item style={{ 
                                                        padding: '12px 16px',
                                                        border: '1px solid #f0f0f0',
                                                        borderRadius: '8px',
                                                        marginBottom: '8px',
                                                        backgroundColor: '#fafafa'
                                                    }}>
                                                        <List.Item.Meta
                                                            avatar={
                                                                <img 
                                                                    src={getDisplayImageUrl(course.thumbnailUrl)} 
                                                                    alt={course.title}
                                                                    style={{
                                                                        width: '60px',
                                                                        height: '40px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                />
                                                            }
                                                            title={<span style={{ fontSize: '14px' }}>{course.title}</span>}
                                                            description={
                                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                                    {course.description}
                                                                    <div style={{ marginTop: 4 }}>
                                                                        <Tag size="small" color="blue">
                                                                            {course.totalLessons || 0} bài học
                                                                        </Tag>
                                                                        <Tag size="small" color="green">
                                                                            <StarOutlined /> {(course.averageRating || 0).toFixed(1)}/5
                                                                        </Tag>
                                                                        {course.price && (
                                                                            <Tag size="small" color="red">
                                                                                {course.price.toLocaleString('vi-VN')} VNĐ
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            }
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                <BookOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
                                                <p style={{ color: '#666' }}>Chưa có khóa học</p>
                                            </div>
                                        )}
                                    </div>
                                </Col>

                                {/* Right Column - Contact Panel */}
                                <Col span={10}>
                                    <div style={{ 
                                        border: '2px solid #1890ff',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        backgroundColor: '#f0f8ff',
                                        position: 'sticky',
                                        top: 20
                                    }}>
                                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                            <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>
                                                Liên hệ giảng viên
                                            </Title>
                                            <p style={{ color: '#666', marginBottom: 0 }}>
                                                Trao đổi trực tiếp với giảng viên
                                            </p>
                                        </div>

                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <Text strong>Thống kê:</Text>
                                            </div>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Tổng học viên"
                                                        value={previewInstructor.totalStudents || 0}
                                                        prefix={<TeamOutlined />}
                                                        valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                                                    />
                                                </Col>
                                                <Col span={12}>
                                                    <Statistic
                                                        title="Khóa học"
                                                        value={previewInstructor.totalCourses || 0}
                                                        prefix={<BookOutlined />}
                                                        valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<MailOutlined />}
                                                onClick={() => handleContactInstructor(previewInstructor)}
                                                style={{ 
                                                    width: '100%',
                                                    height: '50px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Gửi tin nhắn
                                            </Button>
                                            
                                            <Button
                                                type="default"
                                                size="large"
                                                icon={<BookOutlined />}
                                                onClick={() => {
                                                    message.info('Chuyển đến trang khóa học của giảng viên');
                                                }}
                                                style={{ width: '100%', height: '45px' }}
                                            >
                                                Xem tất cả khóa học
                                            </Button>
                                        </Space>

                                        <div style={{ 
                                            textAlign: 'center', 
                                            marginTop: 16,
                                            padding: '12px',
                                            backgroundColor: '#fff2e8',
                                            borderRadius: '8px',
                                            border: '1px solid #ffbb96'
                                        }}>
                                            <Rate disabled defaultValue={previewInstructor.averageRating || 0} />
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', marginTop: 4 }}>
                                                {(previewInstructor.averageRating || 0).toFixed(1)}/5
                                            </div>
                                            <Text style={{ fontSize: '12px', color: '#999' }}>
                                                từ {previewInstructor.totalReviews || 0} đánh giá
                                            </Text>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default InstructorList; 
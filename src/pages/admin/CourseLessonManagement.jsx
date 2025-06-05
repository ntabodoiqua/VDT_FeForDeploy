import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Row, Col, List, Button, Select, Modal, Table, message, Typography, Space, Tooltip, Pagination, Descriptions, Tag, Spin, Image, InputNumber, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, ReadOutlined, LinkOutlined, ExclamationCircleFilled, InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { fetchCoursesApi, fetchLessonsForCourseApi, addLessonToCourseApi, fetchAllSystemLessonsApi, removeLessonFromCourseApi, fetchCourseByIdApi, fetchLessonByIdApi, fetchCourseLessonDetailsApi } from '../../util/api';

const { Title } = Typography;
const { Content } = Layout;
const { confirm } = Modal;

const CourseLessonManagement = () => {
    const [courses, setCourses] = useState([]);
    const [coursePagination, setCoursePagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [lessonsInCourse, setLessonsInCourse] = useState([]);
    const [lessonPagination, setLessonPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [lessonListVersion, setLessonListVersion] = useState(0);
    
    const [allSystemLessons, setAllSystemLessons] = useState([]);
    const [allLessonsModalPagination, setAllLessonsModalPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [loadingAllLessonsModal, setLoadingAllLessonsModal] = useState(false);
    
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [isAddLessonModalVisible, setIsAddLessonModalVisible] = useState(false);
    const [lessonsToAdd, setLessonsToAdd] = useState([]);
    const [lessonConfigurations, setLessonConfigurations] = useState({});
    const [isSubmittingAddLessons, setIsSubmittingAddLessons] = useState(false);

    // State for Course Details Modal
    const [isCourseDetailsModalVisible, setIsCourseDetailsModalVisible] = useState(false);
    const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
    const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);

    // State for Lesson Details Modal
    const [isLessonDetailsModalVisible, setIsLessonDetailsModalVisible] = useState(false);
    const [currentCourseLessonContext, setCurrentCourseLessonContext] = useState(null);
    const [fetchedLessonDetails, setFetchedLessonDetails] = useState(null);
    const [loadingLessonDetails, setLoadingLessonDetails] = useState(false);

    // Helper function to get displayable image URL
    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null;
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }
        // Assuming backend serves images from a base URL if path starts with '/'
        // Update this if your backend serves images differently
        if (urlPath.startsWith('/')) { 
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms'; // Example, adjust as needed
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        console.warn(`getDisplayImageUrl: Encountered an image path in an unexpected format: ${urlPath}`);
        return urlPath; // Fallback for other cases, or could return null
    };

    // Fetch courses on component mount
    useEffect(() => {
        const loadCourses = async () => {
            setLoadingCourses(true);
            try {
                const params = {
                    page: coursePagination.current - 1,
                    size: coursePagination.pageSize,
                };
                const apiResponse = await fetchCoursesApi(params);
                if (apiResponse && typeof apiResponse.code !== 'undefined') {
                    if (apiResponse.code === 1000) {
                        setCourses(apiResponse.result.content || []);
                        setCoursePagination(prev => ({
                            ...prev,
                            total: apiResponse.result.totalElements || 0,
                        }));
                    } else {
                        message.error(apiResponse.message || `Failed to load courses. API Error Code: ${apiResponse.code}`);
                    }
                } else {
                    message.error('Failed to load courses. Invalid response structure from server.');
                }
            } catch (err) {
                let errorMessage = 'Error fetching courses.';
                if (err.response?.data?.message) errorMessage = err.response.data.message;
                else if (err.data?.message) errorMessage = err.data.message;
                else if (err.message) errorMessage = err.message;
                message.error(errorMessage);
            }
            setLoadingCourses(false);
        };
        loadCourses();
    }, [coursePagination.current, coursePagination.pageSize]);

    // Standalone function to load lessons for the selected course
    const loadLessonsForSelectedCourse = useCallback(async () => {
        if (!selectedCourse) return;
        setLoadingLessons(true);
        try {
            const params = {
                page: lessonPagination.current - 1,
                size: lessonPagination.pageSize,
                sort: 'orderIndex,asc'
            };
            const apiResponse = await fetchLessonsForCourseApi(selectedCourse.id, params);
            if (apiResponse && typeof apiResponse.code !== 'undefined') {
                if (apiResponse.code === 1000) {
                    setLessonsInCourse(apiResponse.result.content || []); 
                    setLessonPagination(prev => ({
                        ...prev,
                        total: apiResponse.result.totalElements || 0,
                        current: apiResponse.result.number !== undefined ? apiResponse.result.number + 1 : prev.current 
                    }));
                } else {
                    message.error(apiResponse.message || `Failed to load lessons. API Error Code: ${apiResponse.code}`);
                }
            } else {
                message.error('Failed to load lessons. Invalid response structure from server.');
            }
        } catch (err) {
            let errorMessage = 'Error fetching lessons.';
            if (err.response?.data?.message) errorMessage = err.response.data.message;
            else if (err.data?.message) errorMessage = err.data.message;
            else if (err.message) errorMessage = err.message;
            message.error(errorMessage);
            setLessonsInCourse([]);
        }
        setLoadingLessons(false);
    }, [selectedCourse, lessonPagination.current, lessonPagination.pageSize, lessonListVersion]);

    // useEffect to call loadLessonsForSelectedCourse
    useEffect(() => {
        if (selectedCourse) {
            loadLessonsForSelectedCourse();
        } else {
            setLessonsInCourse([]);
            setLessonPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [selectedCourse, loadLessonsForSelectedCourse, lessonListVersion]);

    // Fetch all system lessons when modal is opened or its pagination changes
    useEffect(() => {
        if (isAddLessonModalVisible) {
            const loadAllSystemLessons = async () => {
                setLoadingAllLessonsModal(true);
                try {
                    const params = {
                        page: allLessonsModalPagination.current - 1,
                        size: allLessonsModalPagination.pageSize,
                    };
                    const apiResponse = await fetchAllSystemLessonsApi(params);
                    if (apiResponse && typeof apiResponse.code !== 'undefined') {
                        if (apiResponse.code === 1000) {
                            setAllSystemLessons(apiResponse.result.content || []);
                            setAllLessonsModalPagination(prev => ({
                                ...prev,
                                total: apiResponse.result.totalElements || 0,
                                current: apiResponse.result.number + 1,
                            }));
                        } else {
                            message.error(apiResponse.message || `Failed to load all lessons. API Error Code: ${apiResponse.code}`);
                        }
                    } else {
                        message.error('Failed to load all lessons. Invalid response structure.');
                    }
                } catch (error) {
                    let errorMessage = 'Error fetching all lessons for modal.';
                    if (error.response?.data?.message) errorMessage = error.response.data.message;
                    else if (error.data?.message) errorMessage = error.data.message;
                    else if (error.message) errorMessage = error.message;
                    message.error(errorMessage);
                }
                setLoadingAllLessonsModal(false);
            };
            loadAllSystemLessons();
        }
    }, [isAddLessonModalVisible, allLessonsModalPagination.current, allLessonsModalPagination.pageSize]);

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setLessonPagination(prev => ({ ...prev, current: 1, total: 0 }));
    };

    const showAddLessonModal = () => {
        if (!selectedCourse) {
            message.warning('Please select a course first.');
            return;
        }
        setAllLessonsModalPagination(prev => ({ ...prev, current: 1 })); 
        setLessonsToAdd([]);
        setLessonConfigurations({});
        setIsAddLessonModalVisible(true);
    };

    const handleAddLessonsToCourse = async () => {
        if (!selectedCourse || Object.keys(lessonConfigurations).length === 0) {
            message.warning('No lessons selected or configured, or course not chosen.');
            return;
        }
        setIsSubmittingAddLessons(true);
        let allAddedSuccessfully = true;
        let processedCount = 0;

        const lessonsToProcess = Object.entries(lessonConfigurations);

        for (const [lessonId, config] of lessonsToProcess) {
            processedCount++;
            const requestPayload = {
                lessonId: lessonId,
                orderIndex: config.orderIndex,
                isVisible: config.isVisible,
                prerequisiteCourseLessonId: config.prerequisiteCourseLessonId,
            };
            try {
                const apiResponse = await addLessonToCourseApi(selectedCourse.id, requestPayload);
                if (!(apiResponse && apiResponse.code === 1000)) {
                    allAddedSuccessfully = false;
                    message.error(apiResponse?.message || `Failed to add lesson "${config.title}".`);
                }
            } catch (error) {
                allAddedSuccessfully = false;
                const errorMsg = error.response?.data?.message || error.message || `Error adding lesson "${config.title}".`;
                message.error(errorMsg);
            }
        }

        if (processedCount > 0) {
            if (allAddedSuccessfully) {
                message.success(`${processedCount} lesson(s) processed successfully.`);
            } else {
                message.warning('Some lessons were not added or encountered errors. Please review messages.');
            }
        }
        
        if (processedCount > 0) {
            setIsAddLessonModalVisible(false);
            setLessonsToAdd([]); 
            setLessonConfigurations({}); 
            if (selectedCourse) {
                setLessonPagination(prev => ({ ...prev, current: 1 })); 
                setLessonListVersion(v => v + 1);
            }
        }
        setIsSubmittingAddLessons(false);
    };

    const handleRemoveLessonFromCourse = async (courseLessonId, lessonTitle) => {
        if (!selectedCourse) return;

        confirm({
            title: `Xóa bài học khỏi khóa học?`,
            icon: <ExclamationCircleFilled />,
            content: `Bạn có chắc chắn muốn xóa bài học "${lessonTitle || 'này'}" khỏi khóa học "${selectedCourse.title}"? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setLoadingLessons(true);
                try {
                    const apiResponse = await removeLessonFromCourseApi(selectedCourse.id, courseLessonId);
                    if (apiResponse && apiResponse.code === 1000) {
                        message.success(apiResponse.result || 'Bài học đã được xóa khỏi khóa học thành công.');
                        // Refresh the list of lessons
                        if (lessonsInCourse.length === 1 && lessonPagination.current > 1) {
                            setLessonPagination(prev => ({ ...prev, current: prev.current - 1, total: prev.total -1 }));
                        } else {
                            setLessonPagination(prev => ({ ...prev, total: prev.total -1 }));
                        }
                        setLessonListVersion(v => v + 1);
                    } else {
                        message.error(apiResponse?.message || 'Không thể xóa bài học khỏi khóa học.');
                    }
                } catch (error) {
                    message.error(error.response?.data?.message || error.message || 'Lỗi khi xóa bài học khỏi khóa học.');
                }
                setLoadingLessons(false);
            },
            onCancel() {
                console.log('Hủy xóa bài học khỏi khóa học.');
            },
        });
    };
    
    const lessonSelectionColumns = [
        { title: 'Lesson Title', dataIndex: 'title', key: 'title' },
        // Add more columns if needed, e.g., lesson description or ID
    ];

    const handleCoursePageChange = (page, pageSize) => {
        setCoursePagination(prev => ({ ...prev, current: page, pageSize }));
        setSelectedCourse(null);
        setLessonsInCourse([]);
    };

    const handleLessonPageChange = (page, pageSize) => {
        setLessonPagination(prev => ({ ...prev, current: page, pageSize }));
    };

    const handleAllLessonsModalTableChange = (pagination) => {
        setAllLessonsModalPagination(prev => ({ ...prev, current: pagination.current, pageSize: pagination.pageSize }));
    };

    // Handlers for Course Details Modal
    const handleOpenCourseDetailsModal = async (courseId) => {
        setLoadingCourseDetails(true);
        setIsCourseDetailsModalVisible(true);
        try {
            const apiResponse = await fetchCourseByIdApi(courseId);
            if (apiResponse && apiResponse.code === 1000) {
                setSelectedCourseDetails(apiResponse.result);
            } else {
                message.error(apiResponse?.message || 'Failed to fetch course details.');
                setIsCourseDetailsModalVisible(false);
            }
        } catch (error) {
            message.error(error.response?.data?.message || error.message || 'Error fetching course details.');
            setIsCourseDetailsModalVisible(false);
        }
        setLoadingCourseDetails(false);
    };

    const handleCloseCourseDetailsModal = () => {
        setIsCourseDetailsModalVisible(false);
        setSelectedCourseDetails(null);
    };

    // Handlers for Lesson Details Modal
    const handleOpenLessonDetailsModal = async (courseLessonItem) => {
        console.log("=== DEBUG: handleOpenLessonDetailsModal ===");
        console.log("courseLessonItem:", courseLessonItem);
        console.log("selectedCourse:", selectedCourse);
        
        if (!selectedCourse || !courseLessonItem || !courseLessonItem.id) {
            console.log("ERROR: Invalid course or lesson data provided.");
            console.log("selectedCourse exists:", !!selectedCourse);
            console.log("courseLessonItem exists:", !!courseLessonItem);
            console.log("courseLessonItem.id exists:", !!courseLessonItem?.id);
            message.error('Invalid course or lesson data provided.');
            setIsLessonDetailsModalVisible(false);
            return;
        }

        setCurrentCourseLessonContext(courseLessonItem);
        setIsLessonDetailsModalVisible(true);
        setLoadingLessonDetails(true);
        setFetchedLessonDetails(null);

        console.log("Making API call with:");
        console.log("selectedCourse.id:", selectedCourse.id);
        console.log("courseLessonItem.id:", courseLessonItem.id);
        console.log("Full URL will be:", `/lms/courses/${selectedCourse.id}/lessons/${courseLessonItem.id}`);

        try {
            const apiResponse = await fetchCourseLessonDetailsApi(selectedCourse.id, courseLessonItem.id);
            console.log("API Response (fetchCourseLessonDetailsApi):", apiResponse);
            console.log("API Response code:", apiResponse?.code);
            console.log("API Response result:", apiResponse?.result);
            
            if (apiResponse && apiResponse.code === 1000 && apiResponse.result) {
                console.log("Setting fetchedLessonDetails to:", apiResponse.result);
                setFetchedLessonDetails(apiResponse.result);
            } else {
                console.log("ERROR: API response failed or missing result");
                console.log("apiResponse exists:", !!apiResponse);
                console.log("apiResponse.code === 1000:", apiResponse?.code === 1000);
                console.log("apiResponse.result exists:", !!apiResponse?.result);
                message.error(apiResponse?.message || 'Failed to fetch detailed lesson information for this course.');
            }
        } catch (error) {
            console.log("ERROR: Exception in fetchCourseLessonDetailsApi:", error);
            console.log("Error response:", error.response);
            console.log("Error data:", error.response?.data);
            console.log("Error message:", error.message);
            
            let errorMessage = 'Error fetching detailed lesson information.';
            if (error.response?.data?.message) errorMessage = error.response.data.message;
            else if (error.data?.message) errorMessage = error.data.message;
            else if (error.message) errorMessage = error.message;
            message.error(errorMessage);
        } finally {
            console.log("Setting loadingLessonDetails to false");
            setLoadingLessonDetails(false);
        }
    };

    const handleCloseLessonDetailsModal = () => {
        setIsLessonDetailsModalVisible(false);
        setCurrentCourseLessonContext(null);
        setFetchedLessonDetails(null);
        setLoadingLessonDetails(false);
    };

    return (
        <Layout style={{ padding: '24px' }}>
            <Content>
                <Title level={2} style={{ marginBottom: '24px' }}>Course - Lesson Linking Management</Title>
                <Row gutter={24}>
                    {/* Courses List Column */}
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                        <Card title="Select a Course" bordered={false} style={{ marginBottom: '24px' }}>
                            <List
                                loading={loadingCourses}
                                itemLayout="horizontal"
                                dataSource={courses}
                                renderItem={course => (
                                    <List.Item
                                        actions={[
                                            <Tooltip title="View course lessons">
                                                <Button type="link" icon={<ReadOutlined />} onClick={() => handleCourseSelect(course)} />
                                            </Tooltip>,
                                            <Tooltip title="View course details">
                                                <Button type="link" icon={<InfoCircleOutlined />} onClick={() => handleOpenCourseDetailsModal(course.id)} />
                                            </Tooltip>
                                        ]}
                                        style={{ 
                                            cursor: 'pointer',
                                            backgroundColor: selectedCourse?.id === course.id ? '#e6f7ff' : 'transparent'
                                        }}
                                        onClick={() => handleCourseSelect(course)}
                                        key={course.id}
                                    >
                                        <List.Item.Meta
                                            title={course.title}
                                            description={course.description}
                                        />
                                    </List.Item>
                                )}
                            />
                            {!loadingCourses && courses.length > 0 && (
                                <Pagination 
                                    current={coursePagination.current}
                                    pageSize={coursePagination.pageSize}
                                    total={coursePagination.total}
                                    onChange={handleCoursePageChange}
                                    style={{ marginTop: '16px', textAlign: 'right' }}
                                    showSizeChanger
                                    pageSizeOptions={['5', '10', '15', '20']}
                                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Lessons in Selected Course Column */}
                    <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                        <Card 
                            title={selectedCourse ? `Lessons in: ${selectedCourse.title}` : "Select a Course to see its Lessons"} 
                            bordered={false}
                            extra={selectedCourse && (
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />} 
                                    onClick={showAddLessonModal}
                                >
                                    Add Lesson(s) to Course
                                </Button>
                            )}
                        >
                            <List
                                loading={loadingLessons}
                                itemLayout="horizontal"
                                dataSource={lessonsInCourse}
                                locale={{ emptyText: selectedCourse ? 'No lessons found in this course.' : 'Please select a course.' }}
                                renderItem={item => (
                                    <List.Item
                                        actions={[
                                            <Tooltip title="View lesson details">
                                                <Button type="text" icon={<InfoCircleOutlined />} onClick={() => handleOpenLessonDetailsModal(item)} />
                                            </Tooltip>,
                                            <Tooltip title="Remove lesson from course">
                                                <Button 
                                                    danger 
                                                    type="text" 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={() => handleRemoveLessonFromCourse(item.id, item.lesson.title)}
                                                />
                                            </Tooltip>
                                        ]}
                                        key={item.id}
                                    >
                                        <List.Item.Meta
                                            title={item.lesson.title}
                                            description={`Order: ${item.orderIndex}`}
                                        />
                                    </List.Item>
                                )}
                            />
                            {!loadingLessons && selectedCourse && lessonsInCourse.length > 0 && (
                                <Pagination
                                    current={lessonPagination.current}
                                    pageSize={lessonPagination.pageSize}
                                    total={lessonPagination.total}
                                    onChange={handleLessonPageChange}
                                    style={{ marginTop: '16px', textAlign: 'right' }}
                                    showSizeChanger
                                    pageSizeOptions={['5', '10', '15', '20']}
                                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Modal to Add Lessons */}
                <Modal
                    title={`Add Lessons to: ${selectedCourse?.title || 'Course'}`}
                    open={isAddLessonModalVisible}
                    onOk={handleAddLessonsToCourse}
                    onCancel={() => {
                        setIsAddLessonModalVisible(false);
                        setLessonsToAdd([]);
                        setLessonConfigurations({});
                    }}
                    width={800}
                    confirmLoading={isSubmittingAddLessons}
                    bodyStyle={{ minHeight: '300px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
                >
                    <Table
                        rowSelection={{
                            type: 'checkbox',
                            onChange: (selectedRowKeys, selectedRows) => {
                                setLessonsToAdd(selectedRowKeys);

                                const currentConfigs = { ...lessonConfigurations };
                                const nextConfigs = {};
            
                                selectedRowKeys.forEach(key => {
                                    if (currentConfigs[key]) {
                                        nextConfigs[key] = currentConfigs[key];
                                    } else {
                                        const lesson = selectedRows.find(r => r.id === key) || allSystemLessons.find(l => l.id === key);
                                        nextConfigs[key] = {
                                            title: lesson ? lesson.title : 'Unknown Lesson',
                                            orderIndex: null,
                                            isVisible: true,
                                            prerequisiteCourseLessonId: null,
                                        };
                                    }
                                });
                                setLessonConfigurations(nextConfigs);
                            },
                            selectedRowKeys: lessonsToAdd,
                            getCheckboxProps: (record) => ({
                                disabled: lessonsInCourse.some(lInCourse => lInCourse.lesson.id === record.id),
                                name: record.title,
                            }),
                        }}
                        columns={lessonSelectionColumns}
                        dataSource={allSystemLessons}
                        rowKey="id"
                        pagination={{
                            current: allLessonsModalPagination.current,
                            pageSize: allLessonsModalPagination.pageSize,
                            total: allLessonsModalPagination.total,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '15'],
                            showTotal:(total, range) => `${range[0]}-${range[1]} of ${total} lessons`
                        }}
                        loading={loadingAllLessonsModal}
                        onChange={handleAllLessonsModalTableChange}
                        scroll={{ y: 300 }}
                    />

                    {Object.keys(lessonConfigurations).length > 0 && (
                        <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                            <Title level={5} style={{ marginBottom: '15px' }}>Configure Selected Lessons:</Title>
                            <div style={{ maxHeight: 'calc(100vh - 550px)', overflowY: 'auto', paddingRight: '10px' }}>
                                {Object.entries(lessonConfigurations).map(([lessonId, config]) => (
                                    <Card key={lessonId} size="small" title={`Configure: ${config.title}`} style={{ marginBottom: 16 }}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Row gutter={16} align="middle">
                                                <Col span={6}><Typography.Text strong>Order Index:</Typography.Text></Col>
                                                <Col span={18}>
                                                    <InputNumber
                                                        placeholder="Auto (appends to end)"
                                                        value={config.orderIndex}
                                                        onChange={value => {
                                                            setLessonConfigurations(prev => ({
                                                                ...prev,
                                                                [lessonId]: { ...prev[lessonId], orderIndex: value === '' || value === null ? null : Number(value) }
                                                            }));
                                                        }}
                                                        style={{ width: '100%' }}
                                                        min={1}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row gutter={16} align="middle">
                                                <Col span={6}><Typography.Text strong>Is Visible:</Typography.Text></Col>
                                                <Col span={18}>
                                                    <Switch
                                                        checked={config.isVisible}
                                                        onChange={checked => {
                                                            setLessonConfigurations(prev => ({
                                                                ...prev,
                                                                [lessonId]: { ...prev[lessonId], isVisible: checked }
                                                            }));
                                                        }}
                                                        checkedChildren="Visible"
                                                        unCheckedChildren="Hidden"
                                                    />
                                                </Col>
                                            </Row>
                                            <Row gutter={16} align="middle">
                                                <Col span={6}><Typography.Text strong>Prerequisite:</Typography.Text></Col>
                                                <Col span={18}>
                                                    <Select
                                                        allowClear
                                                        placeholder="None (no prerequisite)"
                                                        value={config.prerequisiteCourseLessonId}
                                                        onChange={value => {
                                                            setLessonConfigurations(prev => ({
                                                                ...prev,
                                                                [lessonId]: { ...prev[lessonId], prerequisiteCourseLessonId: value }
                                                            }));
                                                        }}
                                                        style={{ width: '100%' }}
                                                        options={[
                                                            { value: null, label: 'None' },
                                                            ...lessonsInCourse
                                                                .map(cl => ({
                                                                    value: cl.id,
                                                                    label: `(Order: ${cl.orderIndex}) ${cl.lesson.title}`
                                                                }))
                                                        ]}
                                                    />
                                                </Col>
                                            </Row>
                                        </Space>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Modal to View Course Details */}
                <Modal
                    title="Course Details"
                    open={isCourseDetailsModalVisible}
                    onCancel={handleCloseCourseDetailsModal}
                    footer={null}
                    width={800}
                >
                    {loadingCourseDetails && <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /><p>Loading details...</p></div>}
                    {!loadingCourseDetails && selectedCourseDetails && (
                        <Descriptions bordered column={1} size="small" layout="horizontal">
                            <Descriptions.Item label="ID">{selectedCourseDetails.id}</Descriptions.Item>
                            <Descriptions.Item label="Tên khóa học">{selectedCourseDetails.title}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả">{selectedCourseDetails.description}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả chi tiết">{selectedCourseDetails.detailedDescription || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Danh mục">{selectedCourseDetails.category?.name || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Ảnh đại diện">
                                {selectedCourseDetails.thumbnailUrl ? (
                                    <Image 
                                        width={100} 
                                        src={getDisplayImageUrl(selectedCourseDetails.thumbnailUrl)}
                                        alt={selectedCourseDetails.title} 
                                    />
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng số bài học">{selectedCourseDetails.totalLessons === undefined ? 'N/A' : selectedCourseDetails.totalLessons}</Descriptions.Item>
                            <Descriptions.Item label="Ngày bắt đầu">{selectedCourseDetails.startDate ? new Date(selectedCourseDetails.startDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày kết thúc">{selectedCourseDetails.endDate ? new Date(selectedCourseDetails.endDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">{selectedCourseDetails.createdAt ? new Date(selectedCourseDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Cập nhật gần nhất">{selectedCourseDetails.updatedAt ? new Date(selectedCourseDetails.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                            {selectedCourseDetails.instructor && (
                                <Descriptions.Item label="Giảng viên">
                                    <Space>
                                        {selectedCourseDetails.instructor.avatarUrl && 
                                            <Image 
                                                width={30} 
                                                height={30}
                                                src={getDisplayImageUrl(selectedCourseDetails.instructor.avatarUrl)} 
                                                alt="avatar" 
                                                style={{ borderRadius: '50%', objectFit: 'cover'}} 
                                                preview={false}
                                            />}
                                        <span>{`${selectedCourseDetails.instructor.firstName || ''} ${selectedCourseDetails.instructor.lastName || ''} (${selectedCourseDetails.instructor.username || 'N/A'})`}</span>
                                    </Space>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Yêu cầu duyệt">
                                <Tag color={selectedCourseDetails.requiresApproval ? "warning" : "default"}>
                                    {selectedCourseDetails.requiresApproval ? "Có" : "Không"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selectedCourseDetails.isActive === undefined ? "default" : (selectedCourseDetails.isActive ? "success" : "error")}>
                                    {selectedCourseDetails.isActive === undefined ? "N/A" : (selectedCourseDetails.isActive ? "Đang mở" : "Đã đóng")}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                    {!loadingCourseDetails && !selectedCourseDetails && (
                        <p>Course details could not be loaded or are not available.</p>
                    )}
                </Modal>

                {/* Modal to View Lesson Details */}
                <Modal
                    title="Lesson Details"
                    open={isLessonDetailsModalVisible}
                    onCancel={handleCloseLessonDetailsModal}
                    footer={[
                        <Button key="back" onClick={handleCloseLessonDetailsModal}>
                            Close
                        </Button>,
                    ]}
                    width={600}
                >
                    {loadingLessonDetails ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="large" />
                            <p>Loading lesson details...</p>
                        </div>
                    ) : fetchedLessonDetails && currentCourseLessonContext ? (
                        <Descriptions bordered column={1} size="small">
                            {/* Lesson Specific Details - from fetchedLessonDetails.lesson */}
                            <Descriptions.Item label="ID (Bài học)">{fetchedLessonDetails.lesson?.id || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Tên bài học">{fetchedLessonDetails.lesson?.title || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả (Nội dung)">{fetchedLessonDetails.lesson?.content || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Video URL">
                                {fetchedLessonDetails.lesson?.videoUrl ? 
                                    <a href={fetchedLessonDetails.lesson.videoUrl} target="_blank" rel="noopener noreferrer">{fetchedLessonDetails.lesson.videoUrl}</a> 
                                    : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tài liệu đính kèm">
                                {fetchedLessonDetails.lesson?.attachmentUrl ? 
                                    <a href={fetchedLessonDetails.lesson.attachmentUrl} target="_blank" rel="noopener noreferrer">{fetchedLessonDetails.lesson.attachmentUrl}</a> 
                                    : 'N/A'}
                            </Descriptions.Item>
                            
                            {/* Course-Context Specific Details - from fetchedLessonDetails directly */}
                            <Descriptions.Item label="Thứ tự trong khóa học">
                                {fetchedLessonDetails.orderIndex === null || fetchedLessonDetails.orderIndex === undefined 
                                    ? 'N/A' 
                                    : fetchedLessonDetails.orderIndex}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hiển thị trong khóa học">
                                <Tag color={fetchedLessonDetails.isVisible === null || fetchedLessonDetails.isVisible ? 'green' : 'red'}>
                                    {fetchedLessonDetails.isVisible === null || fetchedLessonDetails.isVisible ? 'Hiển thị' : 'Ẩn'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID Bài học tiên quyết (CourseLessonID)">
                                {fetchedLessonDetails.prerequisiteCourseLessonId || 'Không có'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tên Bài học tiên quyết">
                                {fetchedLessonDetails.prerequisiteLessonTitle || 'Không có'}
                            </Descriptions.Item>

                            {/* Lesson Metadata - from fetchedLessonDetails.lesson */}
                            <Descriptions.Item label="Ngày tạo (Bài học)">{fetchedLessonDetails.lesson?.createdAt ? new Date(fetchedLessonDetails.lesson.createdAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối (Bài học)">{fetchedLessonDetails.lesson?.updatedAt ? new Date(fetchedLessonDetails.lesson.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                            {fetchedLessonDetails.lesson?.createdBy && (
                                <>
                                    <Descriptions.Item label="Người tạo (Username)">{fetchedLessonDetails.lesson.createdBy.username || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người tạo (Tên)">{`${fetchedLessonDetails.lesson.createdBy.lastName || ''} ${fetchedLessonDetails.lesson.createdBy.firstName || ''}`.trim() || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người tạo (Email)">{fetchedLessonDetails.lesson.createdBy.email || 'N/A'}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    ) : (
                        <>
                            <p>Lesson details could not be loaded or are not available.</p>
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                <p>Debug Info:</p>
                                <p>Loading: {loadingLessonDetails ? 'true' : 'false'}</p>
                                <p>fetchedLessonDetails: {fetchedLessonDetails ? 'exists' : 'null/undefined'}</p>
                                <p>currentCourseLessonContext: {currentCourseLessonContext ? 'exists' : 'null/undefined'}</p>
                            </div>
                        </>
                    )}
                </Modal>
            </Content>
        </Layout>
    );
};

export default CourseLessonManagement; 
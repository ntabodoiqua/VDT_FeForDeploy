import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Row, Col, List, Button, Select, Modal, Table, message, Typography, Space, Tooltip, Pagination, Descriptions, Tag, Spin, Image, InputNumber, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, ReadOutlined, LinkOutlined, ExclamationCircleFilled, InfoCircleOutlined, EyeOutlined, EditOutlined, DragOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchCoursesApi, fetchLessonsForCourseApi, addLessonToCourseApi, fetchAllSystemLessonsApi, removeLessonFromCourseApi, fetchCourseByIdApi, fetchLessonByIdApi, fetchCourseLessonDetailsApi, updateCourseLessonApi } from '../../util/api';

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

    // State for Edit Lesson Modal
    const [isEditLessonModalVisible, setIsEditLessonModalVisible] = useState(false);
    const [editingCourseLesson, setEditingCourseLesson] = useState(null);
    const [editLessonFormValues, setEditLessonFormValues] = useState({ orderIndex: null, isVisible: true, prerequisiteCourseLessonId: null });
    const [isSubmittingEditLesson, setIsSubmittingEditLesson] = useState(false);

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
        setLessonsInCourse([]); // Clear previous lessons
        try {
            // Fetch ALL lessons. We use a large size number. 
            // A better approach might be a dedicated API endpoint or parameter.
            const params = {
                page: 0,
                size: 1000, // Assuming a course won't have more than 1000 lessons
                sort: 'orderIndex,asc'
            };
            const apiResponse = await fetchLessonsForCourseApi(selectedCourse.id, params);
            if (apiResponse && apiResponse.code === 1000) {
                // Ensure the lessons are sorted by orderIndex, as this is crucial for dnd
                const sortedLessons = (apiResponse.result.content || []).sort((a, b) => a.orderIndex - b.orderIndex);
                setLessonsInCourse(sortedLessons);
            } else {
                message.error(apiResponse?.message || `Failed to load lessons. API Error Code: ${apiResponse?.code}`);
                setLessonsInCourse([]);
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
    }, [selectedCourse, lessonListVersion]);

    // useEffect to call loadLessonsForSelectedCourse
    useEffect(() => {
        if (selectedCourse) {
            loadLessonsForSelectedCourse();
        } else {
            setLessonsInCourse([]);
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

    // Handlers for Edit Lesson Modal
    const handleOpenEditLessonModal = (courseLesson) => {
        setEditingCourseLesson(courseLesson);
        setEditLessonFormValues({
            orderIndex: courseLesson.orderIndex,
            isVisible: courseLesson.isVisible !== null ? courseLesson.isVisible : true, // Default to true if null
            prerequisiteCourseLessonId: courseLesson.prerequisiteCourseLessonId || null,
        });
        setIsEditLessonModalVisible(true);
    };

    const handleCloseEditLessonModal = () => {
        setIsEditLessonModalVisible(false);
        setEditingCourseLesson(null);
        setEditLessonFormValues({ orderIndex: null, isVisible: true, prerequisiteCourseLessonId: null });
    };

    const handleUpdateCourseLesson = async () => {
        if (!selectedCourse || !editingCourseLesson) {
            message.error('No course selected or lesson to edit.');
            return;
        }
        setIsSubmittingEditLesson(true);
        try {
            const payload = {
                orderIndex: editLessonFormValues.orderIndex === '' || editLessonFormValues.orderIndex === null ? null : Number(editLessonFormValues.orderIndex),
                isVisible: editLessonFormValues.isVisible,
                prerequisiteCourseLessonId: editLessonFormValues.prerequisiteCourseLessonId || null,
            };

            const apiResponse = await updateCourseLessonApi(selectedCourse.id, editingCourseLesson.id, payload);

            if (apiResponse && apiResponse.code === 1000) {
                message.success('Lesson details updated successfully!');
                setIsEditLessonModalVisible(false);
                setEditingCourseLesson(null);
                // Refresh lesson list
                setLessonListVersion(v => v + 1);
            } else {
                message.error(apiResponse?.message || 'Failed to update lesson details.');
            }
        } catch (error) {
            let errorMessage = 'Error updating lesson details.';
            if (error.response?.data?.message) errorMessage = error.response.data.message;
            else if (error.data?.message) errorMessage = error.data.message;
            else if (error.message) errorMessage = error.message;
            message.error(errorMessage);
        }
        setIsSubmittingEditLesson(false);
    };

    // Handle drag and drop for lesson reordering
    const handleDragEnd = async (result) => {
        if (!result.destination || !selectedCourse) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) {
            return;
        }

        // Create a new array with reordered items
        const reorderedLessons = Array.from(lessonsInCourse);
        const [movedLesson] = reorderedLessons.splice(sourceIndex, 1);
        reorderedLessons.splice(destinationIndex, 0, movedLesson);

        // Update local state immediately for better UX
        setLessonsInCourse(reorderedLessons);

        // Update orderIndex for all affected lessons
        const updatePromises = reorderedLessons.map(async (lesson, index) => {
            const newOrderIndex = index + 1; // Starting from 1
            if (lesson.orderIndex !== newOrderIndex) {
                try {
                    const payload = {
                        orderIndex: newOrderIndex,
                        isVisible: lesson.isVisible,
                        prerequisiteCourseLessonId: lesson.prerequisiteCourseLessonId || null,
                    };
                    
                    const apiResponse = await updateCourseLessonApi(selectedCourse.id, lesson.id, payload);
                    
                    if (apiResponse && apiResponse.code === 1000) {
                        return { success: true, lessonId: lesson.id, newOrder: newOrderIndex };
                    } else {
                        console.error(`Failed to update lesson ${lesson.id}:`, apiResponse?.message);
                        return { success: false, lessonId: lesson.id, error: apiResponse?.message };
                    }
                } catch (error) {
                    console.error(`Error updating lesson ${lesson.id}:`, error);
                    return { success: false, lessonId: lesson.id, error: error.message };
                }
            }
            return { success: true, lessonId: lesson.id, newOrder: newOrderIndex, skipped: true };
        });

        try {
            const results = await Promise.all(updatePromises);
            const failedUpdates = results.filter(r => !r.success);
            
            if (failedUpdates.length > 0) {
                message.warning(`Cập nhật thứ tự thành công nhưng có ${failedUpdates.length} bài học gặp lỗi. Danh sách sẽ được làm mới.`);
                // Refresh the list to get the correct order from server
                setLessonListVersion(v => v + 1);
            } else {
                message.success('Cập nhật thứ tự bài học thành công!');
                // Update local state with new order indices
                const updatedLessons = reorderedLessons.map((lesson, index) => ({
                    ...lesson,
                    orderIndex: index + 1
                }));
                setLessonsInCourse(updatedLessons);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi cập nhật thứ tự bài học. Danh sách sẽ được làm mới.');
            console.error('Error in batch update:', error);
            // Revert local state and refresh from server
            setLessonListVersion(v => v + 1);
        }
    };

    return (
        <Layout style={{ padding: '24px' }}>
            <style jsx>{`
                .drag-handle:active {
                    cursor: grabbing !important;
                }
                
                .lesson-item:hover .drag-handle {
                    color: #1890ff !important;
                }
                
                .dragging-item {
                    transform: rotate(5deg);
                }
            `}</style>
            <Content>
                <Title level={2} style={{ marginBottom: '24px' }}>Quản lý bài học trong khóa học</Title>
                <Row gutter={24}>
                    {/* Courses List Column */}
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                        <Card title="Chọn khóa học" bordered={false} style={{ marginBottom: '24px' }}>
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
                            title={selectedCourse ? (
                                <span>
                                    Bài học trong khóa: {selectedCourse.title}
                                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                                        (Kéo thả để sắp xếp thứ tự)
                                    </span>
                                </span>
                            ) : "Chọn khóa học để xem bài học"} 
                            bordered={false}
                            extra={selectedCourse && (
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />} 
                                    onClick={showAddLessonModal}
                                >
                                    Thêm bài học vào khóa học
                                </Button>
                            )}
                        >
                            {loadingLessons ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Spin size="large" />
                                    <p>Đang tải danh sách bài học...</p>
                                </div>
                            ) : selectedCourse && lessonsInCourse.length > 0 ? (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="lessons-list">
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                style={{
                                                    backgroundColor: snapshot.isDraggingOver ? '#f0f8ff' : 'transparent',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                            >
                                                {lessonsInCourse.map((item, index) => (
                                                    <Draggable
                                                        key={item.id}
                                                        draggableId={item.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                style={{
                                                                    userSelect: 'none',
                                                                    padding: '12px',
                                                                    margin: '0 0 8px 0',
                                                                    backgroundColor: snapshot.isDragging ? '#e6f7ff' : '#fafafa',
                                                                    border: `1px solid ${snapshot.isDragging ? '#1890ff' : '#d9d9d9'}`,
                                                                    borderRadius: '6px',
                                                                    boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
                                                                    transition: 'all 0.2s ease',
                                                                    ...provided.draggableProps.style,
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            style={{
                                                                                marginRight: '12px',
                                                                                cursor: 'grab',
                                                                                color: '#999',
                                                                                fontSize: '16px',
                                                                                display: 'flex',
                                                                                alignItems: 'center'
                                                                            }}
                                                                        >
                                                                            <DragOutlined />
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                                                {item.lesson.title}
                                                                            </div>
                                                                            <div style={{ color: '#666', fontSize: '12px' }}>
                                                                                Thứ tự: {item.orderIndex}
                                                                                {item.isVisible === false && (
                                                                                    <Tag color="red" style={{ marginLeft: '8px' }}>Ẩn</Tag>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                                        <Tooltip title="Chỉnh sửa bài học trong khóa học">
                                                                            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEditLessonModal(item)} />
                                                                        </Tooltip>
                                                                        <Tooltip title="Xem chi tiết bài học">
                                                                            <Button type="text" icon={<InfoCircleOutlined />} onClick={() => handleOpenLessonDetailsModal(item)} />
                                                                        </Tooltip>
                                                                        <Tooltip title="Xóa bài học khỏi khóa học">
                                                                            <Button 
                                                                                danger 
                                                                                type="text" 
                                                                                icon={<DeleteOutlined />} 
                                                                                onClick={() => handleRemoveLessonFromCourse(item.id, item.lesson.title)}
                                                                            />
                                                                        </Tooltip>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    {selectedCourse ? 'Không có bài học nào trong khóa học này.' : 'Vui lòng chọn một khóa học.'}
                                </div>
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

                {/* Modal to Edit Lesson in Course */} 
                {editingCourseLesson && (
                    <Modal
                        title={`Edit Lesson: ${editingCourseLesson.lesson.title}`}
                        open={isEditLessonModalVisible}
                        onOk={handleUpdateCourseLesson}
                        onCancel={handleCloseEditLessonModal}
                        confirmLoading={isSubmittingEditLesson}
                        width={600}
                    >
                        <Space direction="vertical" style={{ width: '100%', marginTop: '20px' }}>
                            <Row gutter={16} align="middle">
                                <Col span={8}><Typography.Text strong>Order Index:</Typography.Text></Col>
                                <Col span={16}>
                                    <InputNumber
                                        placeholder="Leave blank for no change or auto"
                                        value={editLessonFormValues.orderIndex}
                                        onChange={value => setEditLessonFormValues(prev => ({ ...prev, orderIndex: value }))}
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16} align="middle">
                                <Col span={8}><Typography.Text strong>Is Visible:</Typography.Text></Col>
                                <Col span={16}>
                                    <Switch
                                        checked={editLessonFormValues.isVisible}
                                        onChange={checked => setEditLessonFormValues(prev => ({ ...prev, isVisible: checked }))}
                                        checkedChildren="Visible"
                                        unCheckedChildren="Hidden"
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16} align="middle">
                                <Col span={8}><Typography.Text strong>Prerequisite Lesson:</Typography.Text></Col>
                                <Col span={16}>
                                    <Select
                                        allowClear
                                        placeholder="None (no prerequisite)"
                                        value={editLessonFormValues.prerequisiteCourseLessonId}
                                        onChange={value => setEditLessonFormValues(prev => ({ ...prev, prerequisiteCourseLessonId: value }))}
                                        style={{ width: '100%' }}
                                        options={[
                                            { value: null, label: 'None (no prerequisite)' },
                                            ...lessonsInCourse
                                                .filter(cl => cl.id !== editingCourseLesson.id) // Exclude self
                                                .map(cl => ({
                                                    value: cl.id, // This is CourseLessonID
                                                    label: `(Order: ${cl.orderIndex}) ${cl.lesson.title}`
                                                }))
                                        ]}
                                    />
                                </Col>
                            </Row>
                        </Space>
                    </Modal>
                )}
            </Content>
        </Layout>
    );
};

export default CourseLessonManagement; 
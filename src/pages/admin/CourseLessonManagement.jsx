import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Row, Col, List, Button, Select, Modal, Table, message, Typography, Space, Tooltip, Pagination } from 'antd';
import { PlusOutlined, DeleteOutlined, ReadOutlined, LinkOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { fetchCoursesApi, fetchLessonsForCourseApi, addLessonToCourseApi, fetchAllSystemLessonsApi, removeLessonFromCourseApi } from '../../util/api';

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
    }, [selectedCourse, loadLessonsForSelectedCourse]);

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
        setLessonListVersion(v => v + 1);
    };

    const showAddLessonModal = () => {
        if (!selectedCourse) {
            message.warning('Please select a course first.');
            return;
        }
        setAllLessonsModalPagination(prev => ({ ...prev, current: 1 })); 
        setLessonsToAdd([]);
        setIsAddLessonModalVisible(true);
    };

    const handleAddLessonsToCourse = async () => {
        if (!selectedCourse || lessonsToAdd.length === 0) {
            message.warning('No lessons selected or course not chosen.');
            setIsAddLessonModalVisible(false);
            return;
        }
        setLoadingLessons(true); 
        let allAddedSuccessfully = true;

        for (const lessonId of lessonsToAdd) {
            const requestPayload = {
                lessonId: lessonId,
                orderIndex: null, 
                isVisible: true, 
                prerequisiteCourseLessonId: null 
            };
            try {
                const apiResponse = await addLessonToCourseApi(selectedCourse.id, requestPayload);
                if (!(apiResponse && apiResponse.code === 1000)) {
                    allAddedSuccessfully = false;
                    message.error(apiResponse?.message || `Failed to add lesson (ID: ${lessonId}).`);
                }
            } catch (error) {
                allAddedSuccessfully = false;
                message.error(error.response?.data?.message || error.message || `Error adding lesson (ID: ${lessonId}).`);
            }
        }

        if (allAddedSuccessfully) {
            message.success(`${lessonsToAdd.length} lesson(s) processed successfully.`);
        } else {
            message.warning('Some lessons could not be added. Check previous error messages.');
        }
        
        if (selectedCourse) {
            setLessonPagination(prev => ({ ...prev, current: 1, total: 0 }));
            setLessonListVersion(v => v + 1);
        }
        
        setIsAddLessonModalVisible(false);
        setLessonsToAdd([]);
        setLoadingLessons(false);
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
                        setLessonPagination(prev => ({ ...prev, current: 1, total: 0 }));
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
                                        actions={[<Button type="link" icon={<ReadOutlined />} onClick={() => handleCourseSelect(course)}>View Lessons</Button>]}
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
                    onCancel={() => setIsAddLessonModalVisible(false)}
                    width={800}
                    confirmLoading={loadingLessons}
                    bodyStyle={{ minHeight: '300px' }}
                >
                    <Table
                        rowSelection={{
                            type: 'checkbox',
                            onChange: (selectedRowKeys) => {
                                setLessonsToAdd(selectedRowKeys);
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
                </Modal>
            </Content>
        </Layout>
    );
};

export default CourseLessonManagement; 
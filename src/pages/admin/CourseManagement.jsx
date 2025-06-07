/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, message, Image, Switch, Tooltip, Descriptions, Tag, Upload, DatePicker, Row, Col, Card, Collapse } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, UploadOutlined, SearchOutlined, ClearOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    fetchCoursesApi,
    fetchCourseByIdApi,
    createCourseApi,
    updateCourseApi,
    deleteCourseApi,
    toggleCourseStatusApi,
    fetchCategoriesApi
} from '../../util/api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const CourseManagement = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [addEditForm] = Form.useForm();
    const [filterForm] = Form.useForm();
    const [editingCourse, setEditingCourse] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
    const [thumbnailFileList, setThumbnailFileList] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filterValues, setFilterValues] = useState({
        title: null,
        instructorName: null,
        category: null,
        isActive: null,
        createdDateRange: null,
        startDateRange: null,
    });

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null;

        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
            return urlPath;
        }

        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        
        console.warn(`getDisplayImageUrl: Encountered an image path in an unexpected format: ${urlPath}`);
        return urlPath; 
    };

    const getCategoryName = (course) => {
        // Nếu có category object với name
        if (course.category && course.category.name) {
            return course.category.name;
        }
        // Nếu có categoryId
        if (course.categoryId) {
            const foundCategory = categories.find(cat => cat.id === course.categoryId);
            return foundCategory ? foundCategory.name : 'N/A';
        }
        // Nếu có categoryName
        if (course.categoryName) {
            return course.categoryName;
        }
        return 'N/A';
    };

    const columns = [
        {
            title: 'Tên khóa học',
            dataIndex: 'title',
            key: 'title',
            width: 180,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Ảnh đại diện',
            dataIndex: 'thumbnailUrl',
            key: 'thumbnail',
            width: 80,
            align: 'center',
            render: (thumbnailUrl) => {
                const fullUrl = getDisplayImageUrl(thumbnailUrl);
                return fullUrl ? <Image width={40} src={fullUrl} alt="Thumbnail" /> : 'N/A';
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            align: 'center',
            render: (category, record) => getCategoryName(record),
        },
        {
            title: 'Giảng viên',
            dataIndex: 'instructor',
            key: 'instructor',
            width: 150,
            ellipsis: true,
            align: 'center',
            render: (instructor) => instructor ? `${instructor.firstName} ${instructor.lastName} (${instructor.username})` : 'N/A',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 100,
            align: 'center',
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={(checked) => handleStatusToggle(record, checked)}
                />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xem giao diện học viên">
                        <Button
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                            onClick={() => navigate(`/admin/student-course-view/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const fetchCourses = async (page = 1, pageSize = pagination.pageSize, filtersToApply = filterValues) => {
        setLoading(true);
        const params = {
            page: page - 1,
            size: pageSize,
            title: filtersToApply.title || undefined,
            instructorName: filtersToApply.instructorName || undefined,
            category: filtersToApply.category || undefined, 
            isActive: filtersToApply.isActive === null || filtersToApply.isActive === 'all' ? undefined : filtersToApply.isActive,
            createdFrom: filtersToApply.createdDateRange?.[0] ? filtersToApply.createdDateRange[0].startOf('day').toISOString() : undefined,
            createdTo: filtersToApply.createdDateRange?.[1] ? filtersToApply.createdDateRange[1].endOf('day').toISOString() : undefined,
            startDateFrom: filtersToApply.startDateRange?.[0] ? filtersToApply.startDateRange[0].format('YYYY-MM-DD') : undefined,
            startDateTo: filtersToApply.startDateRange?.[1] ? filtersToApply.startDateRange[1].format('YYYY-MM-DD') : undefined,
        };

        Object.keys(params).forEach(key => (params[key] === undefined || params[key] === '') && delete params[key]);
        console.log("Fetching courses with params:", params);

        try {
            const response = await fetchCoursesApi(params);
            const data = response;
            if (data.code === 1000 && data.result) {
                setCourses(data.result.content);
                setPagination({
                    current: data.result.pageable.pageNumber + 1,
                    pageSize: data.result.pageable.pageSize,
                    total: data.result.totalElements,
                });
            } else {
                message.error(data.message || 'Không thể tải danh sách khóa học');
            }
        } catch (error) {
            message.error('Không thể tải danh sách khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesList = async () => {
        try {
            const response = await fetchCategoriesApi({ page: 0, size: 1000 });
            const data = response;
            if (data.code === 1000 && data.result) {
                setCategories(data.result.content);
            } else {
                message.error(data.message || 'Không thể tải danh sách danh mục');
            }
        } catch (error) {
            message.error('Không thể tải danh sách danh mục: ' + error.message);
        }
    };

    useEffect(() => {
        fetchCourses(pagination.current, pagination.pageSize, filterValues);
        fetchCategoriesList();
    }, []);

    const handleViewDetails = async (course) => {
        console.log("View details for course:", course);
        setLoading(true);

        try {
            const response = await fetchCourseByIdApi(course.id);
            console.log("View details raw response (axios):", response);
            const data = response;
            console.log("View details response data (axios):", data);
            if (data.code === 1000 && data.result) {
                setSelectedCourseDetails(data.result);
                setViewModalVisible(true);
            } else {
                message.error(data.message || 'Không thể tải chi tiết khóa học');
            }
        } catch (error) {
            console.error("View details error object:", error);
            message.error('Không thể tải chi tiết khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (course, newActiveStatus) => {
        console.log("Toggling status for course:", course, "to new status:", newActiveStatus);

        try {
            const payload = { isActive: newActiveStatus };
            
            const response = await toggleCourseStatusApi(course.id, payload);
            console.log("Toggle status API Response (axios):", response);
            const apiResponseData = response;

            if (apiResponseData.code === 1000 && apiResponseData.result) {
                const actualStatusFromApi = apiResponseData.result.isActive;

                setCourses(prevCourses =>
                    prevCourses.map(c =>
                        c.id === course.id ? { ...c, isActive: actualStatusFromApi } : c
                    )
                );
                message.success(apiResponseData.message || `Khóa học "${course.title}" ${actualStatusFromApi ? 'đã được mở' : 'đã được đóng'}.`);
            } else {
                message.error(apiResponseData.message || 'Không thể cập nhật trạng thái khóa học.');
            }

        } catch (error) {
            console.error("Toggle status error:", error, "for course:", course, "newStatus:", newActiveStatus);
            const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái khóa học';
            message.error(errorMessage);
        }
    };

    const handleTableChange = (newPageInfo) => {
        const { current, pageSize } = newPageInfo;
        const newPage = pagination.pageSize !== pageSize ? 1 : current;
        fetchCourses(newPage, pageSize, filterValues);
    };

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        
        const formData = {
            ...course,
            instructor: course.instructor ? course.instructor.username : undefined,
            isActive: course.isActive,
            startDate: course.startDate ? dayjs(course.startDate) : null,
            endDate: course.endDate ? dayjs(course.endDate) : null,
            categoryName: getCategoryName(course) !== 'N/A' ? getCategoryName(course) : undefined,
            detailedDescription: course.detailedDescription || undefined,
            requiresApproval: course.requiresApproval,
        };
        addEditForm.setFieldsValue(formData);

        if (course.thumbnailUrl) {
            setThumbnailFileList([{
                uid: '-1',
                name: 'thumbnail.png',
                status: 'done',
                url: getDisplayImageUrl(course.thumbnailUrl),
                thumbUrl: getDisplayImageUrl(course.thumbnailUrl),
            }]);
        } else {
            setThumbnailFileList([]);
        }
        setModalVisible(true);
    };

    const handleDelete = async (course) => {
        console.log("Attempting to delete course:", course);

        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setLoading(true);

                try {
                    const response = await deleteCourseApi(course.id);
                    console.log("Delete course raw response (axios):", response);

                    const data = response;
                    console.log("Delete course response data (axios):", data);
                    if (data.code === 1000) {
                        message.success(data.message || 'Xóa khóa học thành công');
                        fetchCourses(pagination.current, pagination.pageSize, filterValues);
                    } else {
                        message.error(data.message || 'Không thể xóa khóa học. Lỗi từ API.');
                    }
                } catch (error) {
                    console.error("Delete course error object:", error, "for course:", course);
                    const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa khóa học';
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            onCancel: () => {
                console.log('Hủy xóa khóa học');
            },
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        console.log("Form submitted with values:", values);

        try {
            const formData = new FormData();

            if (values.thumbnailFile && values.thumbnailFile.length > 0) {
                if (values.thumbnailFile[0].originFileObj) {
                    formData.append('thumbnail', values.thumbnailFile[0].originFileObj);
                }
            }

            const courseData = {
                title: values.title,
                description: values.description,
                detailedDescription: values.detailedDescription,
                startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
                endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                categoryName: values.categoryName,
            };

            if (values.hasOwnProperty('isActive')) {
                courseData.isActive = values.isActive;
            }
            if (values.hasOwnProperty('requiresApproval')) {
                courseData.requiresApproval = values.requiresApproval;
            }

            formData.append('course', JSON.stringify(courseData));

            let apiCallResponse;
            if (editingCourse) {
                apiCallResponse = await updateCourseApi(editingCourse.id, formData);
                console.log("Update course response (axios):", apiCallResponse);
            } else {
                const creationPayload = {
                    title: values.title,
                    description: values.description,
                    detailedDescription: values.detailedDescription,
                    startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
                    endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                    categoryName: values.categoryName,
                    isActive: values.isActive === undefined ? false : values.isActive,
                    requiresApproval: values.requiresApproval === undefined ? false : values.requiresApproval,
                };

                formData.set('course', JSON.stringify(creationPayload));

                console.log("Attempting to create course (POST request) with formData parts:");
                for (let pair of formData.entries()) {
                    console.log(pair[0]+ ': '+ pair[1]); 
                }
                apiCallResponse = await createCourseApi(formData);
                console.log("Create course response (axios):", apiCallResponse);
            }

            const data = apiCallResponse;
            if (data.code === 1000) {
                message.success(data.message || (editingCourse ? 'Cập nhật khóa học thành công' : 'Tạo khóa học thành công'));
                setModalVisible(false);
                addEditForm.resetFields();
                setEditingCourse(null);
                setThumbnailFileList([]);
                fetchCourses(editingCourse ? pagination.current : 1, pagination.pageSize, filterValues);
            } else {
                message.error(data.message || 'Có lỗi xảy ra khi lưu khóa học.');
            }

        } catch (error) {
            console.error("Submit course error:", error, "Values:", values, "Editing course:", editingCourse);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onApplyFilters = () => {
        const currentFilterFormValues = filterForm.getFieldsValue();
        setFilterValues(currentFilterFormValues);
        fetchCourses(1, pagination.pageSize, currentFilterFormValues);
    };

    const onClearFilters = () => {
        filterForm.resetFields();
        const clearedFilters = {
            title: null, instructorName: null, category: null, isActive: null,
            createdDateRange: null, startDateRange: null,
        };
        setFilterValues(clearedFilters);
        fetchCourses(1, pagination.pageSize, clearedFilters);
    };

    const renderFilterArea = () => (
        <Card style={{ marginBottom: 16 }}>
            <Form form={filterForm} layout="vertical" onFinish={onApplyFilters}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="title" label="Tên khóa học">
                            <Input placeholder="Nhập tên khóa học" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="instructorName" label="Tên giảng viên">
                            <Input placeholder="Nhập tên giảng viên" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="category" label="Danh mục">
                            <Select placeholder="Chọn danh mục" allowClear>
                                {categories.map(cat => (
                                    <Option key={cat.id} value={cat.name}>{cat.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Form.Item name="isActive" label="Trạng thái">
                            <Select placeholder="Chọn trạng thái" allowClear>
                                <Option value="all">Tất cả</Option>
                                <Option value={true}>Đang mở</Option>
                                <Option value={false}>Đã đóng</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={12}>
                        <Form.Item name="createdDateRange" label="Ngày tạo">
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={12}>
                        <Form.Item name="startDateRange" label="Ngày bắt đầu (khóa học)">
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={24} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                                Lọc
                            </Button>
                            <Button onClick={onClearFilters} icon={<ClearOutlined />}>
                                Xóa bộ lọc
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Form>
        </Card>
    );

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingCourse(null);
                        addEditForm.resetFields();
                        setThumbnailFileList([]);
                        setModalVisible(true);
                    }}
                >
                    Thêm khóa học
                </Button>
            </div>

            {renderFilterArea()}

            <Table
                columns={columns}
                dataSource={courses}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '15', '20'],
                }}
                onChange={handleTableChange}
            />

            <Modal
                title={editingCourse ? 'Sửa khóa học' : 'Thêm khóa học'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    addEditForm.resetFields();
                    setEditingCourse(null);
                    setThumbnailFileList([]);
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={addEditForm}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tên khóa học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên khóa học' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <TextArea rows={3} />
                    </Form.Item>

                    <Form.Item
                        name="detailedDescription"
                        label="Mô tả chi tiết"
                    >
                        <TextArea rows={5} />
                    </Form.Item>

                    <Form.Item
                        name="categoryName"
                        label="Danh mục"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select placeholder="Chọn danh mục">
                            {categories.map(category => (
                                <Option key={category.id} value={category.name}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="thumbnailFile"
                        label="Ảnh đại diện"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                    >
                        <Upload
                            name="thumbnail"
                            listType="picture"
                            maxCount={1}
                            fileList={thumbnailFileList}
                            beforeUpload={(file) => {
                                setThumbnailFileList([file]);
                                return false;
                            }}
                            onRemove={() => {
                                setThumbnailFileList([]);
                            }}
                            onChange={({ fileList: newFileList }) => {
                                setThumbnailFileList(newFileList);
                            }}
                        >
                            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Ngày bắt đầu"
                    >
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="Ngày kết thúc"
                    >
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                    
                    {editingCourse && editingCourse.instructor && (
                        <Form.Item
                            name="instructor"
                            label="Giảng viên (Thông tin)"
                        >
                            <Select placeholder="Thông tin giảng viên" disabled>
                                <Option value={editingCourse.instructor.username}>
                                    {`${editingCourse.instructor.firstName} ${editingCourse.instructor.lastName} (${editingCourse.instructor.username})`}
                                </Option>
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item
                        name="isActive"
                        label="Trạng thái khóa học"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select>
                            <Option value={true}>Đang mở</Option>
                            <Option value={false}>Đã đóng</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="requiresApproval"
                        label="Yêu cầu duyệt"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingCourse ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                addEditForm.resetFields();
                                setEditingCourse(null);
                                setThumbnailFileList([]);
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {selectedCourseDetails && (
                <Modal
                    title="Chi tiết khóa học"
                    open={viewModalVisible}
                    onCancel={() => {
                        setViewModalVisible(false);
                        setSelectedCourseDetails(null);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setViewModalVisible(false);
                            setSelectedCourseDetails(null);
                        }}>
                            Đóng
                        </Button>
                    ]}
                    width={800}
                >
                    <Descriptions bordered column={1} layout="horizontal">
                        <Descriptions.Item label="ID">{selectedCourseDetails.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên khóa học">{selectedCourseDetails.title}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{selectedCourseDetails.description}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả chi tiết">{selectedCourseDetails.detailedDescription}</Descriptions.Item>
                        <Descriptions.Item label="Danh mục">{getCategoryName(selectedCourseDetails)}</Descriptions.Item>
                        <Descriptions.Item label="Ảnh đại diện">
                            {selectedCourseDetails.thumbnailUrl ? (
                                <Image 
                                    width={100} 
                                    src={getDisplayImageUrl(selectedCourseDetails.thumbnailUrl)}
                                    alt={selectedCourseDetails.title} 
                                />
                            ) : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng số bài học">{selectedCourseDetails.totalLessons}</Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu">{selectedCourseDetails.startDate ? new Date(selectedCourseDetails.startDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày kết thúc">{selectedCourseDetails.endDate ? new Date(selectedCourseDetails.endDate).toLocaleDateString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{selectedCourseDetails.createdAt ? new Date(selectedCourseDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Cập nhật gần nhất">{selectedCourseDetails.updatedAt ? new Date(selectedCourseDetails.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Descriptions.Item>
                        {selectedCourseDetails.instructor && (
                            <Descriptions.Item label="Giảng viên">
                                {`${selectedCourseDetails.instructor.firstName} ${selectedCourseDetails.instructor.lastName} (${selectedCourseDetails.instructor.username})`}
                                {selectedCourseDetails.instructor.avatarUrl && 
                                    <Image width={50} src={getDisplayImageUrl(selectedCourseDetails.instructor.avatarUrl)} alt="avatar" style={{ marginLeft: 10, borderRadius: '50%'}} />}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Yêu cầu duyệt">{selectedCourseDetails.requiresApproval ? <Tag color="warning">Có</Tag> : <Tag color="default">Không</Tag>}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{selectedCourseDetails.isActive ? <Tag color="success">Đang mở</Tag> : <Tag color="error">Đã đóng</Tag>}</Descriptions.Item>
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
};

export default CourseManagement; 
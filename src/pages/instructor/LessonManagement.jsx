import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Descriptions, Spin, Row, Col, DatePicker, Select, Tooltip, List, Upload, Divider, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, FileTextOutlined, UploadOutlined, DownloadOutlined, UserOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import LargeFileUpload from '../../components/Upload/LargeFileUpload';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { AuthContext } from '../../components/context/auth.context';
import { 
    fetchAllSystemLessonsApi, 
    fetchLessonByIdApi, 
    updateLessonApi, 
    createLessonApi, 
    deleteLessonApi,
    fetchLessonDocumentsApi,
    uploadLessonDocumentApi,
    deleteLessonDocumentApi,
    downloadLessonDocumentApi,
    createQuizApi
} from '../../util/api';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const LessonManagement = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [filterForm] = Form.useForm();
    const [editingLesson, setEditingLesson] = useState(null);
    const [filters, setFilters] = useState({});
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedLessonDetails, setSelectedLessonDetails] = useState(null);
    const [loadingViewDetails, setLoadingViewDetails] = useState(false);
    
    // Lesson Documents state
    const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
    const [lessonDocuments, setLessonDocuments] = useState([]);
    const [selectedLessonForDocs, setSelectedLessonForDocs] = useState(null);
    const [uploadDocumentModalVisible, setUploadDocumentModalVisible] = useState(false);
    const [documentForm] = Form.useForm();
    const [documentFileList, setDocumentFileList] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    
    // Quiz creation state
    const [createQuizModalVisible, setCreateQuizModalVisible] = useState(false);
    const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(null);
    const [quizForm] = Form.useForm();

    const handleFilterSubmit = (values) => {
        const newFilters = { ...values };

        if (newFilters.createdDate) {
            newFilters.createdFrom = newFilters.createdDate[0].startOf('day').toISOString();
            newFilters.createdTo = newFilters.createdDate[1].endOf('day').toISOString();
        }
        delete newFilters.createdDate;

        if (newFilters.updatedDate) {
            newFilters.updatedFrom = newFilters.updatedDate[0].startOf('day').toISOString();
            newFilters.updatedTo = newFilters.updatedDate[1].endOf('day').toISOString();
        }
        delete newFilters.updatedDate;

        const cleanedFilters = {};
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] !== null && newFilters[key] !== undefined && newFilters[key] !== '') {
                cleanedFilters[key] = newFilters[key];
            }
        });

        setFilters(cleanedFilters);
        fetchLessons(1, pagination.pageSize, cleanedFilters);
    };

    const handleFilterReset = () => {
        filterForm.resetFields();
        setFilters({});
        fetchLessons(1, pagination.pageSize, {});
    };

    const columns = [
        {
            title: 'Tên bài học',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: true,
            align: 'center',
            render: (description) => description || 'Chưa có mô tả',
        },
        {
            title: 'Số khóa học',
            dataIndex: 'courseCount',
            key: 'courseCount',
            width: 100,
            align: 'center',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 300,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="dashed"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xem giao diện học viên">
                        <Button
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                            onClick={() => navigate(`/instructor/student-lesson-view/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa bài học">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Quản lý tài liệu">
                        <Button
                            icon={<FileTextOutlined />}
                            onClick={() => handleViewLessonDocuments(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Tạo Quiz">
                        <Button
                            icon={<QuestionCircleOutlined />}
                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                            onClick={() => handleCreateQuiz(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa bài học">
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

    const fetchLessons = async (page = 1, pageSize = 10, currentFilters = filters) => {
        if (!auth.username) return;
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: pageSize,
                ...currentFilters,
                createdBy: auth.username,
            };
            const apiResponse = await fetchAllSystemLessonsApi(params);

            if (apiResponse && typeof apiResponse.code !== 'undefined') {
                if (apiResponse.code === 1000 && apiResponse.result) {
                    setLessons(apiResponse.result.content || []);
                    setPagination({
                        current: (apiResponse.result.pageable?.pageNumber || 0) + 1,
                        pageSize: apiResponse.result.pageable?.pageSize || pageSize,
                        total: apiResponse.result.totalElements || 0,
                    });
                } else {
                    message.error(apiResponse.message || 'Không thể tải danh sách bài học từ API.');
                }
            } else {
                message.error('Phản hồi không hợp lệ từ API khi tải danh sách bài học.');
            }
        } catch (error) {
            console.error("Fetch lessons error:", error);
            let errorMessage = 'Không thể tải danh sách bài học.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.data?.message) {
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth.username) {
            fetchLessons(pagination.current, pagination.pageSize);
        }
    }, [auth.username]);

    const handleViewDetails = async (lessonSummary) => {
        setViewModalVisible(true);
        setLoadingViewDetails(true);
        setSelectedLessonDetails(null);
        try {
            const apiResponse = await fetchLessonByIdApi(lessonSummary.id);
            if (apiResponse && apiResponse.code === 1000 && apiResponse.result) {
                setSelectedLessonDetails(apiResponse.result);
            } else {
                message.error(apiResponse?.message || 'Không thể tải chi tiết bài học.');
                setViewModalVisible(false);
            }
        } catch (error) {
            console.error("Fetch lesson details error:", error);
            let errorMessage = 'Lỗi khi tải chi tiết bài học.';
            if (error.response?.data?.message) errorMessage = error.response.data.message;
            else if (error.data?.message) errorMessage = error.data.message;
            else if (error.message) errorMessage = error.message;
            message.error(errorMessage);
            setViewModalVisible(false);
        } finally {
            setLoadingViewDetails(false);
        }
    };

    const handleEdit = async (lesson) => {
        setEditingLesson(lesson);
        form.resetFields();
        setModalVisible(true);
        try {
            const apiResponse = await fetchLessonByIdApi(lesson.id);
            if (apiResponse && apiResponse.code === 1000 && apiResponse.result) {
                form.setFieldsValue(apiResponse.result);
            } else {
                message.error(apiResponse?.message || 'Không thể tải chi tiết bài học để chỉnh sửa.');
                setModalVisible(false);
            }
        } catch (error) {
            console.error("Fetch lesson details for edit error:", error);
            message.error('Lỗi khi tải chi tiết bài học để chỉnh sửa.');
            setModalVisible(false);
        }
    };

    const handleDelete = (lesson) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc muốn xóa bài học "${lesson.title}" không? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            async onOk() {
                try {
                    const response = await deleteLessonApi(lesson.id);
                    if (response && response.code === 1000) {
                        message.success('Xóa bài học thành công');
                        fetchLessons(pagination.current, pagination.pageSize);
                    } else {
                        message.error(response?.message || 'Không thể xóa bài học.');
                    }
                } catch (error) {
                    console.error("Delete lesson error:", error);
                    let errorMessage = 'Không thể xóa bài học.';
                    if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.data?.message) {
                        errorMessage = error.data.message;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    message.error(errorMessage);
                }
            }
        });
    };

    // Lesson Documents functions
    const handleViewLessonDocuments = async (lesson) => {
        setSelectedLessonForDocs(lesson);
        setDocumentsModalVisible(true);
        await fetchLessonDocuments(lesson.id);
    };

    const fetchLessonDocuments = async (lessonId) => {
        setLoadingDocuments(true);
        try {
            const response = await fetchLessonDocumentsApi(lessonId);
            if (response && response.result) {
                setLessonDocuments(response.result);
            } else {
                message.error('Không thể tải danh sách tài liệu');
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách tài liệu: ' + error.message);
        } finally {
            setLoadingDocuments(false);
        }
    };

    const handleUploadLessonDocument = () => {
        setUploadDocumentModalVisible(true);
    };

    const handleLessonDocumentSubmit = async (values) => {
        if (!documentFileList.length) {
            message.error('Vui lòng chọn file');
            return;
        }

        const formData = new FormData();
        formData.append('request', new Blob([JSON.stringify({
            title: values.title,
            description: values.description
        })], { type: 'application/json' }));
        formData.append('file', documentFileList[0]);

        setUploading(true);
        setShowProgress(true);
        setUploadProgress(0);

        try {
            const response = await uploadLessonDocumentApi(
                selectedLessonForDocs.id, 
                formData, 
                (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            );
            
            if (response && response.result) {
                message.success('Tài liệu đã được tải lên thành công');
                setUploadDocumentModalVisible(false);
                resetUploadState();
                await fetchLessonDocuments(selectedLessonForDocs.id);
            } else {
                message.error('Không thể tải lên tài liệu');
            }
        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'Lỗi khi tải lên tài liệu';
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Tải lên bị timeout. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.';
            } else if (error.response) {
                errorMessage = error.response.data?.message || `Lỗi server: ${error.response.status}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            message.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const resetUploadState = () => {
        documentForm.resetFields();
        setDocumentFileList([]);
        setUploadProgress(0);
        setShowProgress(false);
        setUploading(false);
    };

    const handleFileSelect = (file) => {
        setDocumentFileList([file]);
    };

    const handleDeleteLessonDocument = async (documentId) => {
        Modal.confirm({
            title: 'Bạn có chắc chắn muốn xóa tài liệu này?',
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deleteLessonDocumentApi(selectedLessonForDocs.id, documentId);
                    message.success('Tài liệu đã được xóa thành công');
                    await fetchLessonDocuments(selectedLessonForDocs.id);
                } catch (error) {
                    message.error('Lỗi khi xóa tài liệu: ' + error.message);
                }
            },
        });
    };

    const handleDownloadLessonDocument = async (documentId, fileName) => {
        try {
            const response = await downloadLessonDocumentApi(selectedLessonForDocs.id, documentId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            message.error('Lỗi khi tải xuống tài liệu: ' + error.message);
        }
    };

    // Quiz creation functions
    const handleCreateQuiz = (lesson) => {
        setSelectedLessonForQuiz(lesson);
        setCreateQuizModalVisible(true);
        quizForm.resetFields();
        quizForm.setFieldsValue({
            lessonId: lesson.id,
            type: 'PRACTICE',
            passingScore: 70,
            maxAttempts: 3,
            timeLimitMinutes: 60
        });
    };

    const handleCreateQuizSubmit = async (values) => {
        try {
            const quizData = {
                ...values,
                questions: [] // Start with empty questions, will be added later
            };

            const response = await createQuizApi(quizData);
            if (response && response.code === 1000) {
                message.success('Tạo quiz thành công!');
                setCreateQuizModalVisible(false);
                quizForm.resetFields();
                setSelectedLessonForQuiz(null);

                // Ask if user wants to add questions
                Modal.confirm({
                    title: 'Tạo quiz thành công!',
                    content: 'Bạn có muốn thêm câu hỏi cho quiz này ngay không?',
                    okText: 'Có',
                    cancelText: 'Không',
                    onOk() {
                        navigate(`/instructor/quiz-questions/${response.result.id}`);
                    }
                });
            } else {
                message.error(response.message || 'Không thể tạo quiz.');
            }
        } catch (error) {
            console.error("Create quiz error:", error);
            message.error('Có lỗi xảy ra khi tạo quiz.');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingLesson) {
                const response = await updateLessonApi(editingLesson.id, values);
                if (response && response.code === 1000) {
                    message.success('Cập nhật bài học thành công');
                } else {
                    message.error(response?.message || 'Không thể cập nhật bài học.');
                    return;
                }
            } else {
                const response = await createLessonApi(values);
                if (response && response.code === 1000) {
                    message.success('Tạo bài học thành công');
                } else {
                    message.error(response?.message || 'Không thể tạo bài học.');
                    return;
                }
            }
            setModalVisible(false);
            form.resetFields();
            setEditingLesson(null);
            fetchLessons(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error("Submit error:", error);
            let errorMessage = 'Có lỗi xảy ra';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.data?.message) {
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            message.error(errorMessage);
        }
    };

    const handleTableChange = (newPagination) => {
        fetchLessons(newPagination.current, newPagination.pageSize);
    };

    return (
        <div>
            <Form
                form={filterForm}
                onFinish={handleFilterSubmit}
                layout="vertical"
                style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #d9d9d9' }}
            >
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="title" label="Tên bài học">
                            <Input placeholder="Tìm theo tên bài học" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="createdDate" label="Ngày tạo">
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="updatedDate" label="Ngày cập nhật">
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={24} style={{ textAlign: 'right', alignSelf: 'flex-end', paddingBottom: '8px' }}>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Lọc
                            </Button>
                            <Button onClick={handleFilterReset}>
                                Xóa bộ lọc
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Form>

            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingLesson(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm bài học
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={lessons}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingLesson ? 'Sửa bài học' : 'Thêm bài học'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingLesson(null);
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tên bài học"
                        rules={[{ required: true, message: 'Vui lòng nhập tên bài học' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả ngắn"
                        rules={[{ required: false, message: 'Vui lòng nhập mô tả ngắn' }]}
                    >
                        <TextArea rows={2} placeholder="Mô tả ngắn gọn về bài học..." />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Nội dung chi tiết"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung chi tiết' }]}
                    >
                        <TextArea rows={6} placeholder="Nội dung chi tiết của bài học..." />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingLesson ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingLesson(null);
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {viewModalVisible && (
                <Modal
                    title="Chi tiết bài học"
                    open={viewModalVisible}
                    onCancel={() => {
                        setViewModalVisible(false);
                        setSelectedLessonDetails(null);
                        setLoadingViewDetails(false);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setViewModalVisible(false);
                            setSelectedLessonDetails(null);
                            setLoadingViewDetails(false);
                        }}>
                            Đóng
                        </Button>,
                    ]}
                    width={800}
                >
                    {loadingViewDetails ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="large" />
                            <p>Đang tải chi tiết bài học...</p>
                        </div>
                    ) : selectedLessonDetails ? (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="ID">{selectedLessonDetails.id}</Descriptions.Item>
                            <Descriptions.Item label="Tên bài học">{selectedLessonDetails.title}</Descriptions.Item>
                            <Descriptions.Item label="Số khóa học chứa bài học">{selectedLessonDetails.courseCount}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả ngắn">{selectedLessonDetails.description || 'Chưa có mô tả'}</Descriptions.Item>
                            <Descriptions.Item label="Nội dung chi tiết">{selectedLessonDetails.content || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">{selectedLessonDetails.createdAt ? new Date(selectedLessonDetails.createdAt).toLocaleString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối">{selectedLessonDetails.updatedAt ? new Date(selectedLessonDetails.updatedAt).toLocaleString() : 'N/A'}</Descriptions.Item>
                            {selectedLessonDetails.createdBy && (
                                <>
                                    <Descriptions.Item label="Người tạo (Username)">{selectedLessonDetails.createdBy.username}</Descriptions.Item>
                                    <Descriptions.Item label="Người tạo (Tên)">{`${selectedLessonDetails.createdBy.lastName || ''} ${selectedLessonDetails.createdBy.firstName || ''}`.trim() || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người tạo (Email)">{selectedLessonDetails.createdBy.email || 'N/A'}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    ) : (
                        <p>Không thể tải hoặc không tìm thấy chi tiết bài học.</p>
                    )}
                </Modal>
            )}

            {/* Lesson Documents Modal */}
            <Modal
                title={`Quản lý tài liệu - ${selectedLessonForDocs?.title || ''}`}
                open={documentsModalVisible}
                onCancel={() => {
                    setDocumentsModalVisible(false);
                    setSelectedLessonForDocs(null);
                    setLessonDocuments([]);
                }}
                footer={[
                    <Button key="upload" type="primary" onClick={handleUploadLessonDocument}>
                        <UploadOutlined /> Tải lên tài liệu
                    </Button>,
                    <Button key="close" onClick={() => {
                        setDocumentsModalVisible(false);
                        setSelectedLessonForDocs(null);
                        setLessonDocuments([]);
                    }}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                <List
                    loading={loadingDocuments}
                    dataSource={lessonDocuments}
                    locale={{ emptyText: 'Chưa có tài liệu nào' }}
                    renderItem={(document) => (
                        <List.Item
                            actions={[
                                <Tooltip title="Tải xuống">
                                    <Button 
                                        icon={<DownloadOutlined />} 
                                        onClick={() => handleDownloadLessonDocument(document.id, document.originalFileName)}
                                    />
                                </Tooltip>,
                                <Tooltip title="Xóa">
                                    <Button 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => handleDeleteLessonDocument(document.id)}
                                    />
                                </Tooltip>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                title={document.title}
                                description={
                                    <div>
                                        <div>{document.description}</div>
                                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                            File: {document.originalFileName} | 
                                            Kích thước: {(document.fileSize / 1024).toFixed(2)} KB | 
                                            Tải lên: {new Date(document.uploadedAt).toLocaleDateString('vi-VN')} | 
                                            Bởi: {document.uploadedByUsername}
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Modal>

            {/* Upload Lesson Document Modal */}
            <Modal
                title="Tải lên tài liệu bài học"
                open={uploadDocumentModalVisible}
                onCancel={() => {
                    if (!uploading) {
                        setUploadDocumentModalVisible(false);
                        resetUploadState();
                    }
                }}
                footer={null}
                width={700}
                closable={!uploading}
                maskClosable={!uploading}
            >
                <Form
                    form={documentForm}
                    layout="vertical"
                    onFinish={handleLessonDocumentSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề tài liệu"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề tài liệu' }]}
                    >
                        <Input disabled={uploading} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <TextArea rows={3} disabled={uploading} />
                    </Form.Item>

                    <Form.Item
                        label="File tài liệu"
                        rules={[{ required: true, message: 'Vui lòng chọn file' }]}
                    >
                        <LargeFileUpload
                            onFileSelect={handleFileSelect}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv"
                            maxSizeMB={250}
                            uploading={uploading}
                            uploadProgress={uploadProgress}
                            showProgress={showProgress}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                loading={uploading}
                                disabled={!documentFileList.length || uploading}
                            >
                                {uploading ? 'Đang tải lên...' : 'Tải lên'}
                            </Button>
                            <Button 
                                onClick={() => {
                                    if (!uploading) {
                                        setUploadDocumentModalVisible(false);
                                        resetUploadState();
                                    }
                                }}
                                disabled={uploading}
                            >
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create Quiz Modal */}
            <Modal
                title={`Tạo Quiz cho bài học: ${selectedLessonForQuiz?.title || ''}`}
                open={createQuizModalVisible}
                onCancel={() => {
                    setCreateQuizModalVisible(false);
                    setSelectedLessonForQuiz(null);
                    quizForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={quizForm}
                    layout="vertical"
                    onFinish={handleCreateQuizSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tên Quiz"
                        rules={[{ required: true, message: 'Vui lòng nhập tên quiz!' }]}
                    >
                        <Input placeholder="Nhập tên quiz" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <TextArea rows={3} placeholder="Nhập mô tả quiz" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại Quiz"
                        rules={[{ required: true, message: 'Vui lòng chọn loại quiz!' }]}
                    >
                        <Select placeholder="Chọn loại quiz">
                            <Option value="PRACTICE">Luyện tập</Option>
                            <Option value="ASSESSMENT">Đánh giá</Option>
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="passingScore"
                                label="Điểm đạt (%)"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm đạt!' }]}
                            >
                                <InputNumber 
                                    min={0} 
                                    max={100} 
                                    placeholder="70"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="maxAttempts"
                                label="Số lần thử tối đa"
                                rules={[{ required: true, message: 'Vui lòng nhập số lần thử!' }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    placeholder="3"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="timeLimitMinutes"
                                label="Thời gian (phút)"
                                rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    placeholder="60"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="lessonId"
                        hidden
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => {
                                setCreateQuizModalVisible(false);
                                setSelectedLessonForQuiz(null);
                                quizForm.resetFields();
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Tạo Quiz
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LessonManagement; 
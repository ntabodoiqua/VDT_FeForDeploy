import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, notification, Tag, Select, Input, Row, Col, Image, List, Space, Avatar } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, DownloadOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons';
import { fetchAllFilesAsAdminApi, deleteFileApi, downloadFileWithTokenApi, checkFileUsageApi } from '../../util/api';
import moment from 'moment';
import { debounce } from 'lodash';

const { confirm } = Modal;
const { Option } = Select;

const FileManagement = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        contentType: null,
        fileName: '',
        uploaderName: '', // New filter for admin
    });
    const [sorter, setSorter] = useState({
        field: 'uploadedAt',
        order: 'descend',
    });
    const [fileUsageCache, setFileUsageCache] = useState({});
    const [loadingUsage, setLoadingUsage] = useState({});

    const fetchFiles = useCallback(async (page, size, currentFilters, currentSorter) => {
        setLoading(true);
        try {
            const params = {
                page: page - 1, // API is 0-indexed
                size: size,
            };
            if (currentFilters.contentType) {
                params.contentType = currentFilters.contentType;
            }
            if (currentFilters.fileName) {
                params.fileName = currentFilters.fileName;
            }
            if (currentFilters.uploaderName) {
                params.uploaderName = currentFilters.uploaderName;
            }
            if (currentSorter.field && currentSorter.order) {
                const sortOrder = currentSorter.order === 'ascend' ? 'asc' : 'desc';
                params.sort = `${currentSorter.field},${sortOrder}`;
            }

            // Use admin-specific API
            const res = await fetchAllFilesAsAdminApi(params); 
            if (res && res.result) {
                setFiles(res.result.content);
                setPagination({
                    current: res.result.number + 1,
                    pageSize: res.result.size,
                    total: res.result.totalElements,
                });
            } else {
                notification.error({ message: 'Không thể tải danh sách tệp' });
            }
        } catch (error) {
            notification.error({ message: 'Lỗi khi tải danh sách tệp' });
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetchFiles = useCallback(debounce((p, s, f, sorter) => fetchFiles(p, s, f, sorter), 500), [fetchFiles]);

    useEffect(() => {
        debouncedFetchFiles(pagination.current, pagination.pageSize, filters, sorter);
    }, [filters, sorter, debouncedFetchFiles]);

    const handleDelete = async (fileName) => {
        try {
            const usageResponse = await checkFileUsageApi(fileName);
            const fileUsage = usageResponse.result;

            if (fileUsage.isUsed || fileUsage.used) {
                Modal.confirm({
                    title: 'Cảnh báo: File đang được sử dụng!',
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
                    content: (
                        <div>
                            <p style={{ marginBottom: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                                File "{fileName}" đang được sử dụng trong:
                            </p>
                            <List
                                size="small"
                                dataSource={fileUsage.usageDetails}
                                renderItem={(item) => (
                                    <List.Item>
                                        <div>
                                            <Tag color={
                                                item.type === 'course' ? 'blue' : 
                                                item.type === 'lesson' ? 'green' : 
                                                item.type === 'course_thumbnail' ? 'purple' : 
                                                item.type === 'user_avatar' ? 'orange' : 'gray'
                                            }>
                                                {item.type === 'course' ? 'Khóa học' : 
                                                item.type === 'lesson' ? 'Bài học' :
                                                item.type === 'course_thumbnail' ? 'Thumbnail khóa học' :
                                                item.type === 'user_avatar' ? 'Avatar người dùng' : 'Khác'}
                                            </Tag>
                                            <strong>{item.title}</strong>
                                            <br />
                                            <span style={{ color: '#666', fontSize: '12px' }}>{item.description}</span>
                                        </div>
                                    </List.Item>
                                )}
                            />
                            <p style={{ marginTop: '16px', color: '#ff4d4f' }}>
                                <strong>Nếu bạn xóa file này:</strong>
                                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                    {fileUsage.usageDetails.some(item => item.type === 'course' || item.type === 'lesson') && (
                                        <li>Các tài liệu trong khóa học/bài học sẽ không thể tải xuống được!</li>
                                    )}
                                    {fileUsage.usageDetails.some(item => item.type === 'course_thumbnail') && (
                                        <li>Thumbnail khóa học sẽ bị mất và hiển thị ảnh mặc định!</li>
                                    )}
                                    {fileUsage.usageDetails.some(item => item.type === 'user_avatar') && (
                                        <li>Avatar người dùng sẽ bị mất và hiển thị avatar mặc định!</li>
                                    )}
                                </ul>
                            </p>
                            <p>Bạn có chắc chắn muốn tiếp tục xóa không?</p>
                        </div>
                    ),
                    okText: 'Vẫn xóa',
                    okType: 'danger',
                    cancelText: 'Hủy',
                    width: 600,
                    onOk: async () => {
                        await performDelete(fileName);
                    },
                });
            } else {
                confirm({
                    title: 'Bạn có chắc chắn muốn xóa tệp này?',
                    icon: <ExclamationCircleOutlined />,
                    content: `Tệp "${fileName}" sẽ bị xóa vĩnh viễn.`,
                    okText: 'Xóa',
                    okType: 'danger',
                    cancelText: 'Hủy',
                    onOk: async () => {
                        await performDelete(fileName);
                    },
                });
            }
        } catch (error) {
            console.error('Error checking file usage:', error);
            confirm({
                title: 'Bạn có chắc chắn muốn xóa tệp này?',
                icon: <ExclamationCircleOutlined />,
                content: `Tệp "${fileName}" sẽ bị xóa vĩnh viễn. (Không thể kiểm tra tình trạng sử dụng)`,
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: async () => {
                    await performDelete(fileName);
                },
            });
        }
    };

    const performDelete = async (fileName) => {
        try {
            await deleteFileApi(fileName);
            notification.success({ message: 'Tệp đã được xóa thành công' });
            fetchFiles(pagination.current, pagination.pageSize, filters, sorter);
        } catch (error) {
            notification.error({ message: 'Lỗi khi xóa tệp' });
        }
    };

    const handleTableChange = (newPagination, newFilters, newSorter) => {
        // We control filters separately, so we ignore `newFilters` from antd
        setPagination(newPagination);
        if (newSorter.field && newSorter.order) {
            setSorter({ field: newSorter.field, order: newSorter.order });
        } else {
            // Reset to default sort if user clears sorting
            setSorter({ field: 'uploadedAt', order: 'descend' });
        }
        fetchFiles(newPagination.current, newPagination.pageSize, filters, newSorter);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const downloadFileWithToken = async (file) => {
        try {
            const response = await downloadFileWithTokenApi(file.fileName);
            const blob = response.data || response;
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.originalFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
            notification.success({ message: 'File đã được tải xuống thành công' });
        } catch (error) {
            notification.error({ 
                message: 'Lỗi khi tải file', 
                description: error.response?.data?.message || error.message || 'Không thể tải file' 
            });
        }
    };

    const handlePreview = async (file) => {
        try {
            setPreviewFile(file);
            setPreviewVisible(true);
            
            const response = await downloadFileWithTokenApi(file.fileName);
            const blob = response.data || response;
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            notification.error({ 
                message: 'Lỗi khi tải file preview', 
                description: error.response?.data?.message || error.message || 'Không thể tải file để xem trước' 
            });
        }
    };

    const handleClosePreview = () => {
        setPreviewVisible(false);
        setPreviewFile(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    const getFileUrl = (file) => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/lms')
            ? import.meta.env.VITE_BACKEND_URL.replace('/lms', '')
            : import.meta.env.VITE_BACKEND_URL;
        const folder = file.public ? 'public' : 'private';
        return `${baseUrl}/lms/uploads/${folder}/${file.fileName}`;
    };

    const getAvatarUrl = (user) => {
        if (!user || !user.avatarUrl) {
            return null;
        }
        if (user.avatarUrl.startsWith('http')) {
            return user.avatarUrl;
        }
        const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/lms')
            ? import.meta.env.VITE_BACKEND_URL.replace('/lms', '')
            : import.meta.env.VITE_BACKEND_URL;
        return `${baseUrl}${user.avatarUrl}`;
    };

    const checkFileUsageStatus = async (fileName) => {
        if (fileUsageCache[fileName] !== undefined) return fileUsageCache[fileName];
        if (loadingUsage[fileName]) return null;

        setLoadingUsage(prev => ({ ...prev, [fileName]: true }));
        try {
            const response = await checkFileUsageApi(fileName);
            const usage = response.result;
            setFileUsageCache(prev => ({ ...prev, [fileName]: usage }));
            return usage;
        } catch (error) {
            console.error('Error checking file usage:', error);
            return null;
        } finally {
            setLoadingUsage(prev => ({ ...prev, [fileName]: false }));
        }
    };

    const renderUsageStatus = (fileName) => {
        const usage = fileUsageCache[fileName];
        const loading = loadingUsage[fileName];

        if (loading) return <Tag>Đang kiểm tra...</Tag>;
        if (usage === null || usage === undefined) {
            return (
                <Button 
                    size="small" 
                    type="link" 
                    onClick={() => checkFileUsageStatus(fileName)}
                    style={{ padding: 0, height: 'auto' }}
                >
                    Kiểm tra
                </Button>
            );
        }
        if (usage.isUsed || usage.used) {
            return (
                <Tag color="warning" icon={<WarningOutlined />}>
                    Đang sử dụng ({usage.usageDetails.length})
                </Tag>
            );
        }
        return <Tag color="success">Không sử dụng</Tag>;
    };

    useEffect(() => {
        if (files.length > 0) {
            files.forEach(file => {
                if (!fileUsageCache[file.fileName] && !loadingUsage[file.fileName]) {
                    checkFileUsageStatus(file.fileName);
                }
            });
        }
    }, [files]);

    const columns = [
        {
            title: 'Tên tệp',
            dataIndex: 'originalFileName',
            key: 'originalFileName',
            width: 250,
            ellipsis: true,
            render: (text, record) => (
                <Button 
                    type="link" 
                    style={{ padding: 0, height: 'auto' }}
                    onClick={() => downloadFileWithToken(record)}
                >
                    {text}
                </Button>
            ),
        },
        {
            title: 'Xem trước',
            key: 'preview',
            width: 120,
            align: 'center',
            render: (text, record) => {
                const fileType = record.contentType || '';
                if (fileType.startsWith('image/')) {
                    return (
                        <Button size="small" onClick={() => handlePreview(record)}>
                            Xem
                        </Button>
                    );
                }
                if (fileType === 'application/pdf' || fileType.startsWith('video/')) {
                    return (
                        <Button size="small" onClick={() => handlePreview(record)}>
                            Xem
                        </Button>
                    );
                }
                return <Tag>Không có</Tag>;
            },
        },
        {
            title: 'Người tải lên',
            dataIndex: 'uploadedBy',
            key: 'uploadedBy',
            width: 200,
            ellipsis: true,
            render: (uploadedBy) => (
                <Space>
                    <Avatar src={getAvatarUrl(uploadedBy)} icon={<UserOutlined />} />
                    <span>{uploadedBy ? `${uploadedBy.firstName} ${uploadedBy.lastName}` : 'Không rõ'}</span>
                </Space>
            )
        },
        {
            title: 'Trạng thái sử dụng',
            key: 'usage',
            width: 140,
            align: 'center',
            render: (text, record) => renderUsageStatus(record.fileName),
        },
        {
            title: 'Loại nội dung',
            dataIndex: 'contentType',
            key: 'contentType',
            width: 150,
            align: 'center',
            render: (type) => {
                if (!type) return <Tag>Không xác định</Tag>;
                let color = 'geekblue';
                if (type.startsWith('image')) color = 'green';
                else if (type.startsWith('application/pdf')) color = 'volcano';
                else if (type.includes('word')) color = 'blue';
                return <Tag color={color}>{type.split('/')[0]}</Tag>;
            },
        },
        {
            title: 'Ngày tải lên',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            width: 150,
            align: 'center',
            sorter: true,
            defaultSortOrder: 'descend',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 120,
            align: 'center',
            render: (text, record) => {
                const usage = fileUsageCache[record.fileName];
                const isInUse = usage?.isUsed || usage?.used;
                
                return (
                    <Space size="small">
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadFileWithToken(record)}
                            title="Tải xuống"
                        />
                        <Button
                            size="small"
                            danger={!isInUse}
                            type={isInUse ? "default" : "primary"}
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.fileName)}
                            title={isInUse ? "Xóa (Đang được sử dụng!)" : "Xóa"}
                            style={isInUse ? { borderColor: '#ff4d4f', color: '#ff4d4f' } : {}}
                        />
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <h2>Quản lý tệp toàn hệ thống</h2>
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col>
                    <Input
                        placeholder="Tìm theo tên tệp..."
                        value={filters.fileName}
                        onChange={(e) => handleFilterChange('fileName', e.target.value)}
                        style={{ width: 240 }}
                    />
                </Col>
                <Col>
                    <Input
                        placeholder="Tìm theo tên người tải lên..."
                        value={filters.uploaderName}
                        onChange={(e) => handleFilterChange('uploaderName', e.target.value)}
                        style={{ width: 240 }}
                    />
                </Col>
                <Col>
                    <Select
                        placeholder="Lọc theo loại tệp"
                        style={{ width: 200 }}
                        allowClear
                        value={filters.contentType}
                        onChange={(value) => handleFilterChange('contentType', value)}
                    >
                        <Option value="image">Ảnh</Option>
                        <Option value="application/pdf">PDF</Option>
                        <Option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word (DOCX)</Option>
                        <Option value="application/msword">Word (DOC)</Option>
                        <Option value="video">Video</Option>
                    </Select>
                </Col>
            </Row>
            <Table
                columns={columns}
                dataSource={files}
                loading={loading}
                rowKey="id"
                bordered
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
            />
            <Modal
                open={previewVisible}
                title={`Xem trước: ${previewFile?.originalFileName}`}
                footer={null}
                onCancel={handleClosePreview}
                width="80%"
                destroyOnClose
            >
                {previewFile && previewUrl && (
                     previewFile.contentType.startsWith('image/') ? (
                        <Image width="100%" src={previewUrl} alt={previewFile.originalFileName} />
                    ) : (
                        <iframe
                            src={previewUrl}
                            style={{ width: '100%', height: '75vh', border: 'none' }}
                            title={previewFile.originalFileName}
                        ></iframe>
                    )
                )}
                {previewFile && !previewUrl && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>Đang tải file...</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FileManagement; 
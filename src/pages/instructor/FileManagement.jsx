import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, notification, Tag, Select, Input, Row, Col, Image, List, Space } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, DownloadOutlined, WarningOutlined } from '@ant-design/icons';
import { fetchAllFilesOfUserApi, deleteFileApi, downloadFileWithTokenApi, checkFileUsageApi } from '../../util/api';
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
    });
    const [fileUsageCache, setFileUsageCache] = useState({});
    const [loadingUsage, setLoadingUsage] = useState({});

    const fetchFiles = useCallback(async (page, size, currentFilters) => {
        setLoading(true);
        try {
            const params = {
                page: page - 1, // API is 0-indexed
                size: size,
                contentType: currentFilters.contentType,
                fileName: currentFilters.fileName,
            };
            const res = await fetchAllFilesOfUserApi(params);
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

    const debouncedFetchFiles = useCallback(debounce((p, s, f) => fetchFiles(p, s, f), 500), [fetchFiles]);

    useEffect(() => {
        debouncedFetchFiles(pagination.current, pagination.pageSize, filters);
    }, [filters, debouncedFetchFiles]);

    const handleDelete = async (fileName) => {
        try {
            // First check if file is being used
            const usageResponse = await checkFileUsageApi(fileName);
            const fileUsage = usageResponse.result;

            if (fileUsage.isUsed || fileUsage.used) {
                // Show detailed warning if file is in use
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
                // Show simple confirmation if file is not in use
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
            // Fallback to simple confirmation if check fails
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
            fetchFiles(pagination.current, pagination.pageSize, filters);
        } catch (error) {
            notification.error({ message: 'Lỗi khi xóa tệp' });
        }
    };

    const handleTableChange = (newPagination) => {
        fetchFiles(newPagination.current, newPagination.pageSize, filters);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const downloadFileWithToken = async (file) => {
        try {
            const response = await downloadFileWithTokenApi(file.fileName);
            const blob = response.data || response; // response might be wrapped or direct blob
            
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

    const openFile = (file) => {
        if (file.public) {
            const fileUrl = getFileUrl(file);
            window.open(fileUrl, '_blank');
        } else {
            downloadFileWithToken(file);
        }
    };

    // Function to handle preview with authentication
    const handlePreview = async (file) => {
        try {
            setPreviewFile(file);
            setPreviewVisible(true);
            
            if (!file.public) {
                // For private files, download and create a blob URL
                const response = await downloadFileWithTokenApi(file.fileName);
                const blob = response.data || response;
                const url = window.URL.createObjectURL(blob);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(getFileUrl(file));
            }
        } catch (error) {
            notification.error({ 
                message: 'Lỗi khi tải file preview', 
                description: error.response?.data?.message || error.message || 'Không thể tải file để xem trước' 
            });
        }
    };

    // Clean up preview URL when modal closes
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

    const checkFileUsageStatus = async (fileName) => {
        if (fileUsageCache[fileName] !== undefined) {
            return fileUsageCache[fileName];
        }

        if (loadingUsage[fileName]) {
            return null;
        }

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

        if (loading) {
            return <Tag>Đang kiểm tra...</Tag>;
        }

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

    // Load usage status when files change
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
            title: 'Tên tệp gốc',
            dataIndex: 'originalFileName',
            key: 'originalFileName',
            width: 250,
            ellipsis: true,
            align: 'center',
            render: (text, record) => {
                if (record.public) {
                    return <a href={getFileUrl(record)} target="_blank" rel="noopener noreferrer">{text}</a>;
                } else {
                    return (
                        <span>
                            <Button 
                                type="link" 
                                style={{ padding: 0, height: 'auto' }}
                                onClick={() => openFile(record)}
                            >
                                {text}
                            </Button>
                        </span>
                    );
                }
            },
        },
        {
            title: 'Xem trước',
            key: 'preview',
            width: 120,
            align: 'center',
            render: (text, record) => {
                const fileType = record.contentType || '';

                if (fileType.startsWith('image/')) {
                    if (record.public) {
                        return <Image width={60} src={getFileUrl(record)} alt={record.originalFileName} />;
                    } else {
                        return (
                            <Button size="small" onClick={() => downloadFileWithToken(record)}>
                                <DownloadOutlined />
                            </Button>
                        );
                    }
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
            title: 'Chế độ',
            dataIndex: 'public',
            key: 'public',
            width: 100,
            align: 'center',
            render: isPublic => (isPublic ? <Tag color="success">Công khai</Tag> : <Tag color="error">Riêng tư</Tag>),
        },
        {
            title: 'Ngày tải lên',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            width: 150,
            align: 'center',
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
            <h2>Quản lý tệp đã tải lên</h2>
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
                    pageSizeOptions: ['5', '10', '15', '20'],
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
                    <iframe
                        src={previewUrl}
                        style={{ width: '100%', height: '75vh', border: 'none' }}
                        title={previewFile.originalFileName}
                    ></iframe>
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
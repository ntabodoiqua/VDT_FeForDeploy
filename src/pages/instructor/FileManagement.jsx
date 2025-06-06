import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, notification, Tag, Select, Input, Row, Col, Image } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchAllFilesOfUserApi, deleteFileApi } from '../../util/api';
import moment from 'moment';
import { debounce } from 'lodash';

const { confirm } = Modal;
const { Option } = Select;

const FileManagement = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        contentType: null,
        fileName: '',
    });

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

    const handleDelete = (fileName) => {
        confirm({
            title: 'Bạn có chắc chắn muốn xóa tệp này?',
            icon: <ExclamationCircleOutlined />,
            content: `Tệp "${fileName}" sẽ bị xóa vĩnh viễn.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await deleteFileApi(fileName);
                    notification.success({ message: 'Tệp đã được xóa thành công' });
                    fetchFiles(pagination.current, pagination.pageSize, filters);
                } catch (error) {
                    notification.error({ message: 'Lỗi khi xóa tệp' });
                }
            },
        });
    };

    const handleTableChange = (newPagination) => {
        fetchFiles(newPagination.current, newPagination.pageSize, filters);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getFileUrl = (file) => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/lms')
            ? import.meta.env.VITE_BACKEND_URL.replace('/lms', '')
            : import.meta.env.VITE_BACKEND_URL;
        const folder = file.public ? 'public' : 'private';
        return `${baseUrl}/lms/uploads/${folder}/${file.fileName}`;
    };

    const columns = [
        {
            title: 'Tên tệp gốc',
            dataIndex: 'originalFileName',
            key: 'originalFileName',
            render: (text, record) => <a href={getFileUrl(record)} target="_blank" rel="noopener noreferrer">{text}</a>,
        },
        {
            title: 'Xem trước',
            key: 'preview',
            align: 'center',
            render: (text, record) => {
                const fileType = record.contentType || '';
                const fileUrl = getFileUrl(record);

                if (fileType.startsWith('image/')) {
                    return <Image width={80} src={fileUrl} alt={record.originalFileName} />;
                }

                if (fileType === 'application/pdf' || fileType.startsWith('video/')) {
                    return (
                        <Button onClick={() => {
                            setPreviewFile(record);
                            setPreviewVisible(true);
                        }}>
                            Xem
                        </Button>
                    );
                }

                return <Tag>Không có</Tag>;
            },
        },
        {
            title: 'Loại nội dung',
            dataIndex: 'contentType',
            key: 'contentType',
            render: (type) => {
                if (!type) return <Tag>Không xác định</Tag>;
                let color = 'geekblue';
                if (type.startsWith('image')) color = 'green';
                else if (type.startsWith('application/pdf')) color = 'volcano';
                else if (type.includes('word')) color = 'blue';
                return <Tag color={color}>{type}</Tag>;
            },
        },
        {
            title: 'Chế độ',
            dataIndex: 'public',
            key: 'public',
            render: isPublic => (isPublic ? <Tag color="success">Công khai</Tag> : <Tag color="error">Riêng tư</Tag>),
        },
        {
            title: 'Ngày tải lên',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm:ss'),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.fileName)}
                >
                    Xóa
                </Button>
            ),
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
                pagination={pagination}
                onChange={handleTableChange}
            />
            <Modal
                open={previewVisible}
                title={`Xem trước: ${previewFile?.originalFileName}`}
                footer={null}
                onCancel={() => {
                    setPreviewVisible(false);
                    setPreviewFile(null);
                }}
                width="80%"
                destroyOnClose
            >
                {previewFile && (
                    <iframe
                        src={getFileUrl(previewFile)}
                        style={{ width: '100%', height: '75vh', border: 'none' }}
                        title={previewFile.originalFileName}
                    ></iframe>
                )}
            </Modal>
        </div>
    );
};

export default FileManagement; 
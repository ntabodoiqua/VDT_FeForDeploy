/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Tooltip, Descriptions, Tag, DatePicker } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    fetchCategoriesApi,
    fetchCategoryByIdApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
} from '../../util/api'; // Assuming category APIs are added to the main api.js

const { TextArea } = Input;

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingCategory, setEditingCategory] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Người tạo',
            dataIndex: 'createdByUsername',
            key: 'createdByUsername',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
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

    const fetchCategories = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            // Corresponds to: @GetMapping in CategoryController with pagination
            // page: 0-indexed in backend, size: pageSize
            const response = await fetchCategoriesApi({ page: page - 1, size: pageSize, sortBy: 'createdAt', direction: 'desc' });
            const data = response; // Assuming direct data return from axios customize
            if (data.code === 1000 && data.result) {
                setCategories(data.result.content);
                setPagination({
                    current: data.result.pageable.pageNumber + 1,
                    pageSize: data.result.pageable.pageSize,
                    total: data.result.totalElements,
                });
            } else {
                message.error(data.message || 'Không thể tải danh sách danh mục');
            }
        } catch (error) {
            message.error('Không thể tải danh sách danh mục: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed pagination from dependencies to avoid multiple calls on init if fetchCategories itself updates pagination state then triggers re-render

    const handleViewDetails = async (category) => {
        setLoading(true);
        try {
            // Corresponds to: @GetMapping("/{categoryId}")
            const response = await fetchCategoryByIdApi(category.id);
            const data = response;
            if (data.code === 1000 && data.result) {
                setSelectedCategoryDetails(data.result);
                setViewModalVisible(true);
            } else {
                message.error(data.message || 'Không thể tải chi tiết danh mục');
            }
        } catch (error) {
            message.error('Không thể tải chi tiết danh mục: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        fetchCategories(newPagination.current, newPagination.pageSize);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        form.setFieldsValue({
            name: category.name,
            description: category.description,
        });
        setModalVisible(true);
    };

    const handleDelete = async (category) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                setLoading(true);
                try {
                    // Corresponds to: @DeleteMapping("/{categoryId}")
                    const response = await deleteCategoryApi(category.id);
                    const data = response;
                    if (data.code === 1000) {
                        message.success(data.message || 'Xóa danh mục thành công');
                        fetchCategories(pagination.current, pagination.pageSize); // Refresh list
                    } else {
                        message.error(data.message || 'Không thể xóa danh mục.');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa danh mục';
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        const categoryData = {
            name: values.name,
            description: values.description,
        };

        try {
            let response;
            if (editingCategory) {
                // Corresponds to: @PutMapping("/{categoryId}")
                response = await updateCategoryApi(editingCategory.id, categoryData);
            } else {
                // Corresponds to: @PostMapping()
                response = await createCategoryApi(categoryData);
            }
            const data = response;
            if (data.code === 1000) {
                message.success(data.message || (editingCategory ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công'));
                setModalVisible(false);
                form.resetFields();
                setEditingCategory(null);
                fetchCategories(editingCategory ? pagination.current : 1, pagination.pageSize); // Refresh list, go to first page on create
            } else {
                message.error(data.message || 'Có lỗi xảy ra khi lưu danh mục.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingCategory(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm danh mục
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={categories}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingCategory(null);
                }}
                footer={null} // Using custom footer buttons in Form
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Tên danh mục"
                        rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        // Not making description mandatory as per CategoryRequest DTO
                    >
                        <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingCategory(null);
                            }}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {selectedCategoryDetails && (
                <Modal
                    title="Chi tiết danh mục"
                    open={viewModalVisible}
                    onCancel={() => {
                        setViewModalVisible(false);
                        setSelectedCategoryDetails(null);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setViewModalVisible(false);
                            setSelectedCategoryDetails(null);
                        }}>
                            Đóng
                        </Button>
                    ]}
                    width={600}
                >
                    <Descriptions bordered column={1} layout="horizontal">
                        <Descriptions.Item label="ID">{selectedCategoryDetails.id}</Descriptions.Item>
                        <Descriptions.Item label="Tên danh mục">{selectedCategoryDetails.name}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{selectedCategoryDetails.description || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Người tạo">{selectedCategoryDetails.createdByUsername || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {selectedCategoryDetails.createdAt ? dayjs(selectedCategoryDetails.createdAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </Modal>
            )}
        </div>
    );
};

export default CategoryManagement; 
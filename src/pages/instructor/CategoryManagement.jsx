/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Tooltip, Descriptions, Tag, DatePicker, Row, Col, Card } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AuthContext } from '../../components/context/auth.context';
import {
    fetchCategoriesApi,
    fetchCategoryByIdApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
} from '../../util/api'; // Assuming category APIs are added to the main api.js

const { TextArea } = Input;

const CategoryManagement = () => {
    const { auth } = useContext(AuthContext);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [filterForm] = Form.useForm();
    const [editingCategory, setEditingCategory] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filterValues, setFilterValues] = useState({
        name: null,
    });

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 300,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Người tạo',
            dataIndex: 'createdByUsername',
            key: 'createdByUsername',
            width: 150,
            align: 'center',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            align: 'center',
            render: (_, record) => {
                const isOwner = record.createdByUsername === auth.username;

                return (
                    <Space size="middle">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => handleViewDetails(record)}
                            />
                        </Tooltip>
                        <Tooltip title={!isOwner ? "Bạn không có quyền chỉnh sửa danh mục này" : "Sửa"}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                                disabled={!isOwner}
                            />
                        </Tooltip>
                        <Tooltip title={!isOwner ? "Bạn không có quyền xóa danh mục này" : "Xóa"}>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record)}
                                disabled={!isOwner}
                            />
                        </Tooltip>
                    </Space>
                )
            },
        },
    ];

    const fetchCategories = async (page = 1, pageSize = pagination.pageSize, filters = filterValues) => {
        setLoading(true);
        const params = {
            page: page - 1,
            size: pageSize,
            sortBy: 'createdAt',
            direction: 'desc',
            name: filters.name || undefined,
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            const response = await fetchCategoriesApi(params);
            const data = response;
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
        fetchCategories(pagination.current, pagination.pageSize, filterValues);
    }, []);

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
        fetchCategories(newPagination.current, newPagination.pageSize, filterValues);
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
                        fetchCategories(pagination.current, pagination.pageSize, filterValues); // Refresh list
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
                fetchCategories(editingCategory ? 1 : pagination.current, pagination.pageSize, filterValues); // Refresh list, go to first page on create
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

    const onApplyFilters = (values) => {
        setFilterValues(values);
        fetchCategories(1, pagination.pageSize, values);
    };

    const onClearFilters = () => {
        filterForm.resetFields();
        setFilterValues({ name: null });
        fetchCategories(1, pagination.pageSize, { name: null });
    };

    const renderFilterArea = () => (
        <Card style={{ marginBottom: 16 }}>
            <Form form={filterForm} layout="vertical" onFinish={onApplyFilters}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="name" label="Tên danh mục">
                            <Input placeholder="Nhập tên danh mục để tìm kiếm" />
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
                        setEditingCategory(null);
                        form.resetFields();
                        setModalVisible(true);
                    }}
                >
                    Thêm danh mục
                </Button>
            </div>

            {renderFilterArea()}

            <Table
                columns={columns}
                dataSource={categories}
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
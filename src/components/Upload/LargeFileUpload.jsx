import React, { useState } from 'react';
import { Upload, Button, Progress, message, Alert, Descriptions } from 'antd';
import { UploadOutlined, FileTextOutlined, ExclamationCircleOutlined, PlayCircleOutlined, PictureOutlined, FilePdfOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const LargeFileUpload = ({ 
    onFileSelect, 
    onUploadProgress, 
    accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv", 
    maxSizeMB = 250,
    uploading = false,
    uploadProgress = 0,
    showProgress = false,
    children
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileValidation, setFileValidation] = useState(null);

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
                return <PictureOutlined style={{ color: '#52c41a' }} />;
            case 'doc':
            case 'docx':
                return <FileTextOutlined style={{ color: '#1890ff' }} />;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'wmv':
            case 'flv':
            case 'mkv':
                return <PlayCircleOutlined style={{ color: '#722ed1' }} />;
            default:
                return <FileTextOutlined style={{ color: '#666' }} />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
        
        // Validate file size
        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                error: `File quá lớn! Kích thước tối đa cho phép: ${maxSizeMB}MB. File hiện tại: ${formatFileSize(file.size)}`
            };
        }

        // Validate file type
        const allowedExtensions = [
            'pdf', // PDF files
            'doc', 'docx', // Word documents
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', // Image files
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv' // Video files
        ];
        
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            return {
                isValid: false,
                error: `Loại file không được hỗ trợ! Chỉ cho phép: PDF, DOC/DOCX, ảnh (JPG, PNG, GIF...) và video (MP4, AVI, MOV...). File hiện tại: .${fileExtension || 'không rõ'}`
            };
        }

        return {
            isValid: true,
            error: null
        };
    };

    const beforeUpload = (file) => {
        const validation = validateFile(file);
        setFileValidation(validation);
        
        if (!validation.isValid) {
            message.error(validation.error);
            return false;
        }

        setSelectedFile(file);
        if (onFileSelect) {
            onFileSelect(file);
        }
        
        return false; // Prevent automatic upload
    };

    const customRequest = ({ file, onProgress, onSuccess, onError }) => {
        // This will be handled by parent component
        if (onUploadProgress) {
            onUploadProgress({ file, onProgress, onSuccess, onError });
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        beforeUpload,
        customRequest,
        showUploadList: false,
        accept
    };

    return (
        <div style={{ width: '100%' }}>
            {/* File Size Warning */}
            <Alert
                message="Lưu ý về upload file"
                description={`Chỉ cho phép: PDF, Word (DOC/DOCX), ảnh (JPG, PNG, GIF...), video (MP4, AVI, MOV...). Kích thước tối đa ${maxSizeMB}MB. Với file lớn, quá trình upload có thể mất vài phút.`}
                type="info"
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
                showIcon
            />

            {/* Upload Area */}
            <Dragger {...uploadProps} disabled={uploading}>
                <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: 48, color: uploading ? '#ccc' : '#1890ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16 }}>
                    {uploading ? 'Đang tải lên...' : 'Nhấp hoặc kéo file vào đây để tải lên'}
                </p>
                <p className="ant-upload-hint" style={{ color: '#666' }}>
                    Hỗ trợ: PDF, DOC/DOCX, ảnh (JPG, PNG, GIF...), video (MP4, AVI, MOV...). Kích thước tối đa: {maxSizeMB}MB
                </p>
            </Dragger>

            {/* File Info */}
            {selectedFile && (
                <div style={{ marginTop: 16 }}>
                    <Descriptions 
                        title="Thông tin file đã chọn" 
                        size="small" 
                        bordered
                        column={1}
                        style={{ backgroundColor: '#fafafa' }}
                    >
                        <Descriptions.Item label="Tên file">
                            <FileTextOutlined style={{ marginRight: 8 }} />
                            {selectedFile.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kích thước">
                            {formatFileSize(selectedFile.size)}
                        </Descriptions.Item>
                                                                <Descriptions.Item label="Loại file">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getFileIcon(selectedFile.name)}
                                                <span>{selectedFile.type || 'Không xác định'}</span>
                                            </div>
                                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}

            {/* Upload Progress */}
            {showProgress && (
                <div style={{ marginTop: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                        <span>Tiến trình upload: </span>
                        <span style={{ fontWeight: 'bold' }}>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress 
                        percent={Math.round(uploadProgress)} 
                        status={uploadProgress === 100 ? 'success' : 'active'}
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                    />
                    {uploading && (
                        <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                            Đang tải lên file... Vui lòng không tắt trình duyệt.
                        </div>
                    )}
                </div>
            )}

            {/* Validation Error */}
            {fileValidation && !fileValidation.isValid && (
                <Alert
                    message="Lỗi validation file"
                    description={fileValidation.error}
                    type="error"
                    style={{ marginTop: 16 }}
                    showIcon
                />
            )}

            {/* Custom children for additional actions */}
            {children}
        </div>
    );
};

export default LargeFileUpload; 
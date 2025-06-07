# Hướng dẫn Upload File Lớn

## Tổng quan
Đã cải thiện hệ thống upload file để hỗ trợ file lớn (lên tới 250MB) với các tính năng:

- ✅ Progress bar theo dõi tiến trình upload
- ✅ Validation file size trước khi upload
- ✅ Timeout 5 phút cho upload file lớn  
- ✅ Error handling chi tiết
- ✅ UI/UX tối ưu cho file lớn

## Thay đổi chính

### 1. **Cấu hình Axios**
```javascript
// axios.customize.js
timeout: 60000, // 1 minute default timeout
maxContentLength: 500 * 1024 * 1024, // 500MB max content length
maxBodyLength: 500 * 1024 * 1024 // 500MB max body length
```

### 2. **API với Progress Tracking**
```javascript
// api.js
const uploadCourseDocumentApi = (courseId, formData, onUploadProgress = null) => {
    return axios.post(`/lms/courses/${courseId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: onUploadProgress
    });
};
```

### 3. **Component LargeFileUpload**
- Drag & drop upload area
- File size validation (tối đa 250MB)
- File type validation (chỉ cho phép PDF, DOC/DOCX, ảnh, video)
- Progress bar với animation
- Thông tin file chi tiết với icon phù hợp
- Cảnh báo cho file lớn

## Sử dụng

### Import Component
```javascript
import LargeFileUpload from '../../components/Upload/LargeFileUpload';
```

### Trong Form
```javascript
<LargeFileUpload
    onFileSelect={handleFileSelect}
    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv"
    maxSizeMB={250}
    uploading={uploading}
    uploadProgress={uploadProgress}
    showProgress={showProgress}
/>
```

### Xử lý Upload với Progress
```javascript
const handleSubmit = async (values) => {
    setUploading(true);
    setShowProgress(true);
    setUploadProgress(0);

    try {
        const response = await uploadApi(
            id, 
            formData, 
            (progressEvent) => {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(progress);
            }
        );
        // Handle success
    } catch (error) {
        // Handle errors with detailed messages
        if (error.code === 'ECONNABORTED') {
            message.error('Tải lên bị timeout. Vui lòng thử lại với file nhỏ hơn.');
        }
    } finally {
        setUploading(false);
    }
};
```

## Lưu ý quan trọng

### 1. **File Size Limits**
- Frontend: 250MB (có thể cấu hình)
- Backend: Cần cấu hình tương ứng

### 2. **Timeout Settings**
- Default: 1 phút
- Upload file lớn: 5 phút
- Có thể điều chỉnh theo nhu cầu

### 3. **Error Handling**
- Timeout errors
- Network errors  
- Server errors (404, 500, etc.)
- File size validation
- File type validation (chỉ cho phép: PDF, DOC/DOCX, ảnh, video)

### 4. **UX Considerations**
- Disable modal close khi đang upload
- Show progress để user biết tiến trình
- Cảnh báo không tắt browser
- Loading states trên buttons

## Các tệp đã cập nhật

1. `src/util/axios.customize.js` - Cấu hình axios
2. `src/util/api.js` - API với progress tracking
3. `src/components/Upload/LargeFileUpload.jsx` - Component upload mới
4. `src/pages/instructor/LessonManagement.jsx` - Sử dụng component
5. `src/pages/instructor/CourseManagement.jsx` - Sử dụng component

## Test Cases

### File Size Testing
- ✅ File < 1MB: Upload nhanh
- ✅ File 1-50MB: Upload với progress  
- ✅ File 50-250MB: Upload với cảnh báo
- ❌ File > 250MB: Validation error

### Network Testing  
- ✅ Mạng tốt: Upload thành công
- ✅ Mạng chậm: Progress tracking
- ❌ Mạng mất: Timeout error với message rõ ràng

## Tối ưu hóa thêm (nếu cần)

1. **Chunked Upload**: Chia file lớn thành chunks
2. **Resume Upload**: Hỗ trợ upload lại từ đoạn bị ngắt
3. **Background Upload**: Upload ngầm khi user chuyển trang
4. **Compression**: Nén file trước khi upload 
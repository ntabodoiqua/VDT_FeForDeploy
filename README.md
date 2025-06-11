# Dự án Innolearn (VDT_frontend)

Đây là project frontend cho ứng dụng Innolearn, được xây dựng bằng React và Vite.

### Yêu cầu môi trường
- **Node.js**: Phiên bản v20.x trở lên. Bạn có thể tải tại [https://nodejs.org/](https://nodejs.org/)

---

## Hướng dẫn cài đặt và chạy dự án

### 1. Clone repository
```bash
# Thay <your-repository-url> bằng URL repository của bạn
git clone <your-repository-url>
cd VDT_frontend
```

### 2. Cài đặt dependencies
Sử dụng một trong hai lệnh sau:
```bash
npm install
```
hoặc
```bash
yarn install
```

### 3. Cấu hình biến môi trường
-   Sao chép file `.env.example` thành một file mới tên là `.env.development` (nếu có file `.env.example`).
-   Mở file `.env.development` và cập nhật các giá trị cho phù hợp với môi trường local của bạn.

---
## Chạy dự án

### Chế độ Development
Để khởi động server development, chạy lệnh:
```bash
npm run dev
```
Dự án sẽ được chạy tại `http://localhost:5173` (hoặc một cổng khác nếu cổng 5173 đã bị chiếm dụng).

### Chế độ Production
Để build và preview phiên bản production:

1.  **Build dự án:**
    ```bash
    npm run build
    ```
    Lệnh này sẽ tạo ra một thư mục `dist` chứa các file đã được tối ưu hóa cho production.

2.  **Preview bản build:**
    ```bash
    npm run preview
    ```
    Lệnh này sẽ khởi động một server để bạn xem trước phiên bản production.

---

## Chức năng chính của dự án

**Innolearn** là một hệ thống quản lý học tập trực tuyến (LMS - Learning Management System) được xây dựng với 3 vai trò người dùng chính: Quản trị viên (Admin), Giảng viên (Instructor), và Học viên (Student).

### 🔑 Chức năng chung
- **Landing Page**: Giao diện giới thiệu cho người dùng chưa đăng nhập.
- **Authentication**: Hỗ trợ đăng ký, đăng nhập cho người dùng.
- **Phân quyền**: Tự động điều hướng người dùng đến giao diện phù hợp (Admin, Instructor, Student) sau khi đăng nhập.

### Quản trị viên (Admin)
- **Dashboard**: Thống kê tổng quan về toàn bộ hệ thống.
- **Quản lý người dùng**: Quản lý tất cả tài khoản.
- **Quản lý giảng viên**: Quản lý tập trung các giảng viên trên hệ thống.
- **Quản lý khóa học**: Toàn quyền quản lý các khóa học, bài học, danh mục.
- **Quản lý ghi danh & đánh giá**: Quản lý việc ghi danh và các đánh giá của học viên.
- **Quản lý Quiz**: Tạo và quản lý bộ câu hỏi, bài kiểm tra cho các khóa học.
- **Quản lý Files**: Quản lý tài nguyên được tải lên hệ thống.

### Giảng viên (Instructor)
- **Dashboard**: Thống kê về các khóa học của riêng mình (lượt ghi danh, đánh giá).
- **Quản lý khóa học**: Tạo, chỉnh sửa, xóa các khóa học và bài học do mình phụ trách.
- **Quản lý Quiz**: Tạo và quản lý bài kiểm tra cho khóa học của mình.
- **Tương tác học viên**: Theo dõi ghi danh và xem đánh giá từ học viên.
- **Quản lý thông tin cá nhân**: Cập nhật hồ sơ và mật khẩu.
- **Quản lý files**: Quản lý các tài nguyên đã tải lên của mình. 

###  Học viên (Student)
- **Khám phá khóa học**: Tìm kiếm, xem chi tiết và đăng ký các khóa học có sẵn.
- **Khám phá giảng viên**: Tìm kiếm, xem chi tiết các giảng viên của hệ thống.
- **Giao diện học tập**: Theo dõi tiến độ, xem video bài giảng, đọc tài liệu.
- **Làm bài kiểm tra**: Tham gia các bài kiểm tra và xem lại kết quả.
- **Quản lý tài khoản**: Cập nhật thông tin cá nhân và xem các khóa học đã đăng ký.
- **Đánh giá khóa học**: Viết và gửi đánh giá cho các khóa học đã hoàn thành.

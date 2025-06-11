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

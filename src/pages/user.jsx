import { notification, Table } from "antd";
import { useEffect, useState } from "react";

const UserPage = () => {
    // Không có API lấy danh sách user, chỉ hiển thị thông báo
    useEffect(() => {
        notification.info({
            message: "Thông báo",
            description: "Chức năng này chưa được hỗ trợ."
        });
    }, []);

    return (
        <div style={{ padding: 30 }}>
            <h2>Chức năng này chưa được hỗ trợ.</h2>
        </div>
    )
}

export default UserPage;
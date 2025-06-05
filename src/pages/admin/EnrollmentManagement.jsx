import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Tag, Progress, Typography, Divider, Card, Select } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data - replace with API calls later
const mockCourses = [
    { id: 'course1', name: 'Khóa học ReactJS Cơ bản', instructor: 'Nguyễn Văn A', students: [
        { id: 'stud1', name: 'Trần Thị B', progress: 75, status: 'enrolled' },
        { id: 'stud2', name: 'Lê Văn C', progress: 100, status: 'enrolled' },
    ], pendingStudents: [
        { id: 'pend1', name: 'Phạm Thị D', reason: 'Chờ duyệt' },
    ]},
    { id: 'course2', name: 'Node.js Nâng cao', instructor: 'Nguyễn Thị E', students: [
        { id: 'stud3', name: 'Vũ Văn F', progress: 50, status: 'enrolled' },
    ], pendingStudents: [] },
    { id: 'course3', name: 'Quản lý dự án Agile', instructor: 'Hoàng Văn G', students: [], pendingStudents: [
         { id: 'pend2', name: 'Đặng Thị H', reason: 'Chờ duyệt vào khóa' },
         { id: 'pend3', name: 'Lý Văn I', reason: 'Đã đăng ký' },
    ]},
];

const EnrollmentManagement = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courses, setCourses] = useState([]); // Will be fetched from API

    useEffect(() => {
        // Simulate API call
        setCourses(mockCourses);
        if (mockCourses.length > 0) {
            // setSelectedCourse(mockCourses[0]); // Auto-select first course
        }
    }, []);

    const handleCourseSelect = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        setSelectedCourse(course);
    };

    const approveStudent = (studentId) => {
        // API call to approve student
        console.log(`Approving student ${studentId} for course ${selectedCourse?.id}`);
        // Update local state or refetch
        setSelectedCourse(prev => ({
            ...prev,
            students: [...prev.students, prev.pendingStudents.find(s => s.id === studentId)],
            pendingStudents: prev.pendingStudents.filter(s => s.id !== studentId)
        }));
    };

    const rejectStudent = (studentId) => {
        // API call to reject student
        console.log(`Rejecting student ${studentId} for course ${selectedCourse?.id}`);
        // Update local state or refetch
        setSelectedCourse(prev => ({
            ...prev,
            pendingStudents: prev.pendingStudents.filter(s => s.id !== studentId)
        }));
    };

    return (
        <div style={{ padding: '20px' }}>
            <Title level={3}>Quản lý Enrollment</Title>
            <Text>Chọn một khóa học để xem chi tiết enrollment.</Text>
            
            <Select
                style={{ width: '100%', marginBottom: '20px', marginTop: '10px' }}
                placeholder="Chọn khóa học"
                onChange={handleCourseSelect}
                value={selectedCourse?.id}
            >
                {courses.map(course => (
                    <Option key={course.id} value={course.id}>{course.name}</Option>
                ))}
            </Select>

            {selectedCourse && (
                <Card title={`Chi tiết Enrollment cho: ${selectedCourse.name}`}>
                    <Text strong>Giảng viên:</Text> <Text>{selectedCourse.instructor}</Text>
                    <Divider />

                    <Title level={4}>Học viên đã tham gia ({selectedCourse.students.length})</Title>
                    {selectedCourse.students.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedCourse.students}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={`https://i.pravatar.cc/150?u=${item.id}`} />}
                                        title={<a href="#">{item.name}</a>}
                                        description={`Trạng thái: ${item.status}`}
                                    />
                                    <div style={{ width: '150px' }}>
                                        <Text>Tiến độ: </Text>
                                        <Progress percent={item.progress} size="small" />
                                    </div>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Text>Chưa có học viên nào trong khóa học này.</Text>
                    )}
                    

                    <Divider />
                    <Title level={4}>Học viên chờ duyệt ({selectedCourse.pendingStudents.length})</Title>
                    {selectedCourse.pendingStudents.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedCourse.pendingStudents}
                            renderItem={item => (
                                <List.Item
                                    actions={[
                                        <Button type="primary" size="small" onClick={() => approveStudent(item.id)}>Duyệt</Button>,
                                        <Button type="default" danger size="small" onClick={() => rejectStudent(item.id)}>Từ chối</Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={`https://i.pravatar.cc/150?u=${item.id}`} />}
                                        title={<a href="#">{item.name}</a>}
                                        description={`Lý do: ${item.reason || 'Chờ duyệt'}`}
                                    />
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Text>Không có học viên nào đang chờ duyệt.</Text>
                    )}
                </Card>
            )}
        </div>
    );
};

export default EnrollmentManagement; 
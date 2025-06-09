import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Card, Row, Col, Select, InputNumber, Switch, Tag, Tooltip, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, MenuOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AuthContext } from '../../components/context/auth.context';
import {
    fetchQuizByIdApi,
    addQuestionToQuizApi,
    updateQuizQuestionApi,
    deleteQuizQuestionApi,
    reorderQuizQuestionsApi
} from '../../util/api';

const { TextArea } = Input;
const { Option } = Select;

const QuizQuestionManagement = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [reorderMode, setReorderMode] = useState(false);

    const fetchQuizDetails = async () => {
        setLoading(true);
        try {
            const response = await fetchQuizByIdApi(quizId);
            if (response && response.code === 1000) {
                setQuiz(response.result);
                setQuestions(response.result.questions?.sort((a, b) => a.orderIndex - b.orderIndex) || []);
            } else {
                message.error('Không thể tải chi tiết quiz.');
                navigate('/admin/quiz-management');
            }
        } catch (error) {
            console.error("Fetch quiz details error:", error);
            message.error('Có lỗi xảy ra khi tải chi tiết quiz.');
            navigate('/admin/quiz-management');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (quizId) {
            fetchQuizDetails();
        }
    }, [quizId]);

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        form.resetFields();
        // Set default values for new question
        form.setFieldsValue({
            orderIndex: questions.length + 1,
            points: 5.0,
            answers: [
                { answerText: '', isCorrect: true, orderIndex: 1 },
                { answerText: '', isCorrect: false, orderIndex: 2 }
            ]
        });
        setModalVisible(true);
    };

    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        form.setFieldsValue({
            questionText: question.questionText,
            points: question.points,
            orderIndex: question.orderIndex,
            explanation: question.explanation,
            answers: question.answers?.sort((a, b) => a.orderIndex - b.orderIndex) || []
        });
        setModalVisible(true);
    };

    const handleDeleteQuestion = (question) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa câu hỏi "${question.questionText}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    const response = await deleteQuizQuestionApi(question.id);
                    if (response && response.code === 1000) {
                        message.success('Xóa câu hỏi thành công!');
                        fetchQuizDetails();
                    } else {
                        message.error(response.message || 'Không thể xóa câu hỏi.');
                    }
                } catch (error) {
                    console.error("Delete question error:", error);
                    if (error.response?.data?.code === 1063) {
                        message.error('Không thể xóa câu hỏi đã có học viên làm bài.');
                    } else {
                        message.error('Có lỗi xảy ra khi xóa câu hỏi.');
                    }
                }
            }
        });
    };

    const handleSubmitQuestion = async (values) => {
        try {
            // Validate answers
            const answers = values.answers || [];
            if (answers.length < 2) {
                message.error('Mỗi câu hỏi phải có ít nhất 2 đáp án!');
                return;
            }

            const correctAnswers = answers.filter(answer => answer.isCorrect);
            if (correctAnswers.length !== 1) {
                message.error('Mỗi câu hỏi phải có đúng 1 đáp án đúng!');
                return;
            }

            // Ensure all answers have text
            if (answers.some(answer => !answer.answerText?.trim())) {
                message.error('Tất cả đáp án phải có nội dung!');
                return;
            }

            const questionData = {
                questionText: values.questionText,
                points: values.points,
                orderIndex: values.orderIndex,
                explanation: values.explanation,
                answers: answers.map((answer, index) => ({
                    answerText: answer.answerText,
                    isCorrect: answer.isCorrect,
                    orderIndex: index + 1
                }))
            };

            const response = editingQuestion
                ? await updateQuizQuestionApi(editingQuestion.id, questionData)
                : await addQuestionToQuizApi(quizId, questionData);

            if (response && response.code === 1000) {
                message.success(`${editingQuestion ? 'Cập nhật' : 'Thêm'} câu hỏi thành công!`);
                setModalVisible(false);
                form.resetFields();
                setEditingQuestion(null);
                fetchQuizDetails();
            } else {
                message.error(response.message || `Không thể ${editingQuestion ? 'cập nhật' : 'thêm'} câu hỏi.`);
            }
        } catch (error) {
            console.error("Submit question error:", error);
            if (error.response?.data?.code === 1078) {
                message.error('Thứ tự câu hỏi này đã tồn tại. Vui lòng chọn thứ tự khác.');
            } else {
                message.error(`Có lỗi xảy ra khi ${editingQuestion ? 'cập nhật' : 'thêm'} câu hỏi.`);
            }
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        
        if (sourceIndex === destinationIndex) return;

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destinationIndex, 0, reorderedItem);

        // Optimistically update UI
        setQuestions(items);

        try {
            // Update order indexes
            const reorderedQuestions = items.map((item, index) => ({
                questionId: item.id,
                orderIndex: index + 1
            }));

            const response = await reorderQuizQuestionsApi(quizId, reorderedQuestions);
            if (response && response.code === 1000) {
                message.success('Sắp xếp câu hỏi thành công!');
                fetchQuizDetails();
            } else {
                message.error('Không thể sắp xếp câu hỏi.');
                fetchQuizDetails(); // Revert to original order
            }
        } catch (error) {
            console.error("Reorder questions error:", error);
            let errorMessage = 'Có lỗi xảy ra khi sắp xếp câu hỏi.';
            
            if (error.response?.data?.code === 1078) {
                errorMessage = 'Có xung đột thứ tự câu hỏi. Đang tải lại...';
            } else if (error.response?.data?.code === 1049) {
                errorMessage = 'Có xung đột dữ liệu. Đang tải lại...';
            } else if (error.response?.status === 409) {
                errorMessage = 'Xung đột dữ liệu khi sắp xếp. Đang tải lại...';
            } else if (error.response?.status === 403) {
                errorMessage = 'Bạn không có quyền sắp xếp câu hỏi này.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            message.error(errorMessage);
            fetchQuizDetails(); // Revert to original order
        }
    };

    const columns = [
        {
            title: 'STT',
            dataIndex: 'orderIndex',
            key: 'orderIndex',
            width: 60,
            align: 'center',
            render: (orderIndex, record, index) => reorderMode ? (
                <MenuOutlined style={{ cursor: 'grab' }} />
            ) : orderIndex,
        },
        {
            title: 'Nội dung câu hỏi',
            dataIndex: 'questionText',
            key: 'questionText',
            ellipsis: true,
            render: (text) => (
                <div style={{ maxWidth: 300 }}>
                    {text}
                </div>
            ),
        },
        {
            title: 'Điểm',
            dataIndex: 'points',
            key: 'points',
            width: 80,
            align: 'center',
        },
        {
            title: 'Số đáp án',
            dataIndex: 'answers',
            key: 'answersCount',
            width: 100,
            align: 'center',
            render: (answers) => answers?.length || 0,
        },
        {
            title: 'Đáp án đúng',
            dataIndex: 'answers',
            key: 'correctAnswer',
            width: 200,
            ellipsis: true,
            render: (answers) => {
                const correctAnswer = answers?.find(answer => answer.isCorrect);
                return correctAnswer ? (
                    <Tag color="green">{correctAnswer.answerText}</Tag>
                ) : (
                    <Tag color="red">Chưa có đáp án đúng</Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Sửa câu hỏi">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEditQuestion(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa câu hỏi">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDeleteQuestion(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const QuestionTable = () => {
        if (reorderMode) {
            return (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="questions">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {questions.map((question, index) => (
                                    <Draggable key={question.id} draggableId={question.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    marginBottom: 8,
                                                    backgroundColor: snapshot.isDragging ? '#f0f0f0' : 'white',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: 6,
                                                    padding: 16,
                                                }}
                                            >
                                                <Row align="middle">
                                                    <Col span={2}>
                                                        <MenuOutlined style={{ cursor: 'grab' }} />
                                                    </Col>
                                                    <Col span={16}>
                                                        <strong>{question.questionText}</strong>
                                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                                            {question.points} điểm • {question.answers?.length || 0} đáp án
                                                        </div>
                                                    </Col>
                                                    <Col span={6} style={{ textAlign: 'right' }}>
                                                        <Space>
                                                            <Button
                                                                type="primary"
                                                                icon={<EditOutlined />}
                                                                size="small"
                                                                onClick={() => handleEditQuestion(question)}
                                                            />
                                                            <Button
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                onClick={() => handleDeleteQuestion(question)}
                                                            />
                                                        </Space>
                                                    </Col>
                                                </Row>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            );
        }

        return (
            <Table
                columns={columns}
                dataSource={questions}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 800 }}
            />
        );
    };

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Quản lý câu hỏi cho Quiz: {quiz?.title}</span>
                                <Button
                                    type="default"
                                    onClick={() => navigate('/admin/quiz-management')}
                                >
                                    Quay lại danh sách Quiz
                                </Button>
                            </div>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <Button
                                    type={reorderMode ? "primary" : "default"}
                                    icon={reorderMode ? <SaveOutlined /> : <MenuOutlined />}
                                    onClick={() => setReorderMode(!reorderMode)}
                                >
                                    {reorderMode ? 'Hoàn thành sắp xếp' : 'Sắp xếp câu hỏi'}
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddQuestion}
                                >
                                    Thêm câu hỏi
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card>
                <QuestionTable />
            </Card>

            {/* Add/Edit Question Modal */}
            <Modal
                title={editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingQuestion(null);
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitQuestion}
                >
                    <Form.Item
                        name="questionText"
                        label="Nội dung câu hỏi"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi!' }]}
                    >
                        <TextArea rows={3} placeholder="Nhập nội dung câu hỏi" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="points"
                                label="Điểm"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm!' }]}
                            >
                                <InputNumber
                                    min={0.1}
                                    step={0.1}
                                    placeholder="5.0"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="orderIndex"
                                label="Thứ tự"
                                rules={[{ required: true, message: 'Vui lòng nhập thứ tự!' }]}
                            >
                                <InputNumber
                                    min={1}
                                    placeholder="1"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="explanation"
                        label="Giải thích (tuỳ chọn)"
                    >
                        <TextArea rows={2} placeholder="Nhập giải thích cho câu hỏi" />
                    </Form.Item>

                    <Divider>Đáp án</Divider>

                    <Form.List name="answers">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Card
                                        key={field.key}
                                        size="small"
                                        style={{ marginBottom: 16 }}
                                        title={`Đáp án ${index + 1}`}
                                        extra={
                                            fields.length > 2 && (
                                                <Button
                                                    type="link"
                                                    danger
                                                    onClick={() => remove(field.name)}
                                                >
                                                    Xóa
                                                </Button>
                                            )
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'answerText']}
                                                    rules={[{ required: true, message: 'Vui lòng nhập nội dung đáp án!' }]}
                                                >
                                                    <Input placeholder="Nhập nội dung đáp án" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'isCorrect']}
                                                    valuePropName="checked"
                                                >
                                                    <Switch
                                                        checkedChildren="Đúng"
                                                        unCheckedChildren="Sai"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add({ answerText: '', isCorrect: false, orderIndex: fields.length + 1 })}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Thêm đáp án
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingQuestion(null);
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingQuestion ? 'Cập nhật' : 'Thêm câu hỏi'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default QuizQuestionManagement; 
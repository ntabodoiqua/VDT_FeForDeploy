import React, { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Descriptions, Spin, Row, Col, Select, Tooltip, Tag, Card, Statistic, InputNumber, Switch, Radio, Progress, Alert, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, BarChartOutlined, PlayCircleOutlined, StopOutlined, QuestionCircleOutlined, ExperimentOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { AuthContext } from '../../components/context/auth.context';
import { 
    fetchQuizzesApi, 
    fetchQuizByIdApi, 
    updateQuizApi, 
    createQuizApi, 
    deleteQuizApi,
    toggleQuizStatusApi,
    fetchQuizSummaryApi,
    fetchAllSystemLessonsApi,
    startQuizPreviewApi,
    answerQuestionPreviewApi,
    submitQuizPreviewApi,
    getPreviewStatusApi
} from '../../util/api';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const KatexRenderer = ({ content, ...props }) => {
    const contentRef = useRef(null);

    useEffect(() => {
        const element = contentRef.current;
        if (element) {
            try {
                renderMathInElement(element, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error("KaTeX rendering error:", error);
            }
        }
    }, [content]);

    return (
        <div
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: content || "" }}
            {...props}
        />
    );
};

const QuizManagement = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedQuizDetails, setSelectedQuizDetails] = useState(null);
    const [loadingViewDetails, setLoadingViewDetails] = useState(false);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [quizSummary, setQuizSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [lessons, setLessons] = useState([]);
    
    // Preview quiz states
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewAttempt, setPreviewAttempt] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [previewAnswers, setPreviewAnswers] = useState({});
    const [previewResult, setPreviewResult] = useState(null);
    const [previewStartTime, setPreviewStartTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const timerRef = useRef(null);

    const fetchQuizzes = async (page = 1, pageSize = 10) => {
        if (!auth.username) return;
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: pageSize,
                sortBy: 'createdAt',
                sortDir: 'desc'
            };
            const apiResponse = await fetchQuizzesApi(params);

            if (apiResponse && apiResponse.code === 1000) {
                setQuizzes(apiResponse.result.content || []);
                setPagination({
                    current: (apiResponse.result.pageable?.pageNumber || 0) + 1,
                    pageSize: apiResponse.result.pageable?.pageSize || pageSize,
                    total: apiResponse.result.totalElements || 0,
                });
            } else {
                message.error(apiResponse.message || 'Không thể tải danh sách quiz.');
            }
        } catch (error) {
            console.error("Fetch quizzes error:", error);
            message.error('Không thể tải danh sách quiz.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLessons = async () => {
        try {
            const params = {
                page: 0,
                size: 1000,
                createdBy: auth.username,
            };
            const apiResponse = await fetchAllSystemLessonsApi(params);
            if (apiResponse && apiResponse.code === 1000) {
                setLessons(apiResponse.result.content || []);
            }
        } catch (error) {
            console.error("Fetch lessons error:", error);
        }
    };

    useEffect(() => {
        fetchQuizzes();
        fetchLessons();
    }, [auth.username]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const handleViewDetails = async (quiz) => {
        setLoadingViewDetails(true);
        setViewModalVisible(true);
        try {
            const response = await fetchQuizByIdApi(quiz.id);
            if (response && response.code === 1000) {
                setSelectedQuizDetails(response.result);
            } else {
                message.error('Không thể tải chi tiết quiz.');
            }
        } catch (error) {
            console.error("View quiz details error:", error);
            message.error('Có lỗi xảy ra khi tải chi tiết quiz.');
        } finally {
            setLoadingViewDetails(false);
        }
    };

    const handleViewSummary = async (quiz) => {
        setLoadingSummary(true);
        setSummaryModalVisible(true);
        try {
            const response = await fetchQuizSummaryApi(quiz.id);
            if (response && response.code === 1000) {
                setQuizSummary(response.result);
            } else {
                message.error('Không thể tải thống kê quiz.');
            }
        } catch (error) {
            console.error("View quiz summary error:", error);
            message.error('Có lỗi xảy ra khi tải thống kê quiz.');
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleEdit = (quiz) => {
        setEditingQuiz(quiz);
        form.setFieldsValue({
            title: quiz.title,
            description: quiz.description,
            type: quiz.type,
            lessonId: quiz.lesson?.id,
            passingScore: quiz.passingScore,
            maxAttempts: quiz.maxAttempts,
            timeLimitMinutes: quiz.timeLimitMinutes,
        });
        setModalVisible(true);
    };

    const handleDelete = (quiz) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa quiz "${quiz.title}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    const response = await deleteQuizApi(quiz.id);
                    if (response && response.code === 1000) {
                        message.success('Xóa quiz thành công!');
                        fetchQuizzes(pagination.current, pagination.pageSize);
                    } else {
                        message.error(response.message || 'Không thể xóa quiz.');
                    }
                } catch (error) {
                    console.error("Delete quiz error:", error);
                    message.error('Có lỗi xảy ra khi xóa quiz.');
                }
            }
        });
    };

    const handleToggleStatus = async (quiz) => {
        try {
            const response = await toggleQuizStatusApi(quiz.id);
            if (response && response.code === 1000) {
                message.success(`${quiz.isActive ? 'Tắt' : 'Bật'} quiz thành công!`);
                fetchQuizzes(pagination.current, pagination.pageSize);
            } else {
                message.error(response.message || 'Không thể thay đổi trạng thái quiz.');
            }
        } catch (error) {
            console.error("Toggle quiz status error:", error);
            message.error('Có lỗi xảy ra khi thay đổi trạng thái quiz.');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const response = editingQuiz 
                ? await updateQuizApi(editingQuiz.id, values)
                : await createQuizApi({
                    ...values,
                    questions: [] // Start with empty questions, will be added later
                });

            if (response && response.code === 1000) {
                message.success(`${editingQuiz ? 'Cập nhật' : 'Tạo'} quiz thành công!`);
                setModalVisible(false);
                form.resetFields();
                setEditingQuiz(null);
                fetchQuizzes(pagination.current, pagination.pageSize);

                // If creating new quiz, navigate to question management
                if (!editingQuiz && response.result?.id) {
                    Modal.confirm({
                        title: 'Tạo quiz thành công!',
                        content: 'Bạn có muốn thêm câu hỏi cho quiz này ngay không?',
                        okText: 'Có',
                        cancelText: 'Không',
                        onOk() {
                            navigate(`/instructor/quiz-questions/${response.result.id}`);
                        }
                    });
                }
            } else {
                message.error(response.message || `Không thể ${editingQuiz ? 'cập nhật' : 'tạo'} quiz.`);
            }
        } catch (error) {
            console.error("Submit quiz error:", error);
            message.error(`Có lỗi xảy ra khi ${editingQuiz ? 'cập nhật' : 'tạo'} quiz.`);
        }
    };

    const handleTableChange = (newPagination) => {
        fetchQuizzes(newPagination.current, newPagination.pageSize);
    };

    // Preview quiz functions
    const handleStartPreview = async (quiz) => {
        setPreviewLoading(true);
        setPreviewModalVisible(true);
        try {
            // Start preview attempt
            const response = await startQuizPreviewApi(quiz.id);
            if (response && response.code === 1000) {
                const attempt = response.result;
                
                // If attemptAnswers is empty, fetch quiz details to get questions
                if (!attempt.attemptAnswers || attempt.attemptAnswers.length === 0) {
                    console.log('attemptAnswers is empty, fetching quiz details...');
                    const quizDetailsResponse = await fetchQuizByIdApi(quiz.id);
                    if (quizDetailsResponse && quizDetailsResponse.code === 1000) {
                        const quizDetails = quizDetailsResponse.result;
                        
                        // Create mock attemptAnswers from quiz questions
                        const mockAttemptAnswers = quizDetails.questions?.map((question, index) => ({
                            id: `attempt-answer-${question.id}`,
                            question: question,
                            selectedAnswer: null,
                            pointsEarned: 0.0,
                            answeredAt: null,
                            isCorrect: false
                        })) || [];
                        
                        // Update attempt with questions
                        attempt.attemptAnswers = mockAttemptAnswers;
                        attempt.totalQuestions = quizDetails.questions?.length || 0;
                        
                        console.log('Quiz details fetched successfully:', {
                            questionsCount: quizDetails.questions?.length,
                            mockAttemptAnswers: mockAttemptAnswers.length
                        });
                    }
                }
                
                setPreviewAttempt(attempt);
                setCurrentQuestionIndex(0);
                setPreviewAnswers({});
                setPreviewResult(null);
                // Use startedAt from backend for accurate timing
                setPreviewStartTime(attempt.startedAt ? new Date(attempt.startedAt) : new Date());
                
                // Set up timer if quiz has time limit
                if (quiz.timeLimitMinutes) {
                    setTimeRemaining(quiz.timeLimitMinutes * 60); // Convert to seconds
                    startTimer();
                }
                
                message.success('Bắt đầu preview quiz thành công!');
            } else {
                message.error('Không thể bắt đầu preview quiz.');
                setPreviewModalVisible(false);
            }
        } catch (error) {
            console.error("Start preview error:", error);
            message.error('Có lỗi xảy ra khi bắt đầu preview quiz.');
            setPreviewModalVisible(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmitPreview(true); // Auto submit when time's up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerQuestion = async (questionId, answerId) => {
        if (!previewAttempt || previewResult) return;
        
        console.log('Answering question:', { sessionId: previewAttempt.id, questionId, answerId });
        
        try {
            const response = await answerQuestionPreviewApi(previewAttempt.id, questionId, answerId);
            console.log('Answer question response:', response);
            
            if (response && response.code === 1000) {
                setPreviewAnswers(prev => ({
                    ...prev,
                    [questionId]: {
                        selectedAnswer: response.result.selectedAnswer,
                        isCorrect: response.result.isCorrect,
                        pointsEarned: response.result.pointsEarned
                    }
                }));
                console.log('Answer saved successfully for question:', questionId);
            } else {
                console.error('Answer failed with response:', response);
                message.error(`Không thể lưu câu trả lời. ${response?.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            console.error("Answer question error:", error);
            console.error("Error details:", error.response?.data);
            
            if (error.response?.status === 400) {
                message.error('Session preview không hợp lệ hoặc câu hỏi không tồn tại.');
            } else {
                message.error('Có lỗi xảy ra khi trả lời câu hỏi.');
            }
        }
    };

    const handleSubmitPreview = async (autoSubmit = false) => {
        if (!previewAttempt) return;
        
        console.log('Submitting preview with session ID:', previewAttempt.id);
        console.log('Preview attempt data:', previewAttempt);
        
        try {
            const response = await submitQuizPreviewApi(previewAttempt.id);
            console.log('Submit preview response:', response);
            
            if (response && response.code === 1000) {
                setPreviewResult(response.result);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                if (autoSubmit) {
                    message.warning('Hết thời gian! Quiz đã được nộp tự động.');
                } else {
                    message.success('Nộp bài thành công!');
                }
            } else {
                console.error('Submit failed with response:', response);
                message.error(`Không thể nộp bài. ${response?.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            console.error("Submit preview error:", error);
            console.error("Error details:", error.response?.data);
            
            if (error.response?.status === 400) {
                // Fallback: Calculate results locally if backend preview fails
                console.log('Backend preview failed, calculating results locally...');
                const localResult = calculateLocalPreviewResult();
                if (localResult) {
                    setPreviewResult(localResult);
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    message.warning('Đã tính kết quả cục bộ do lỗi server preview.');
                } else {
                    message.error('Session preview không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
                }
            } else {
                message.error('Có lỗi xảy ra khi nộp bài.');
            }
        }
    };

    const handleClosePreview = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setPreviewModalVisible(false);
        setPreviewAttempt(null);
        setPreviewAnswers({});
        setPreviewResult(null);
        setCurrentQuestionIndex(0);
        setTimeRemaining(null);
        setPreviewStartTime(null);
    };

    const getAnsweredQuestionsCount = () => {
        if (!previewAttempt) return 0;
        return Object.keys(previewAnswers).filter(questionId => previewAnswers[questionId]).length;
    };

    const getCurrentQuestion = () => {
        if (!previewAttempt) return null;
        
        if (!previewAttempt.attemptAnswers || previewAttempt.attemptAnswers.length === 0) {
            return null;
        }
        
        return previewAttempt.attemptAnswers[currentQuestionIndex];
    };

    const calculateLocalPreviewResult = () => {
        if (!previewAttempt || !previewStartTime) return null;
        
        const answeredQuestions = Object.keys(previewAnswers).filter(qId => previewAnswers[qId]);
        let totalScore = 0;
        let correctAnswers = 0;
        
        // Calculate score from answered questions
        answeredQuestions.forEach(questionId => {
            const answer = previewAnswers[questionId];
            if (answer.isCorrect) {
                correctAnswers++;
                totalScore += answer.pointsEarned;
            }
        });
        
        const totalPossibleScore = previewAttempt.attemptAnswers?.reduce((sum, attemptAnswer) => {
            return sum + (attemptAnswer.question.points || 0);
        }, 0) || 0;
        
        const percentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
        const now = new Date();
        const startTime = previewStartTime || (previewAttempt.startedAt ? new Date(previewAttempt.startedAt) : now);
        
        return {
            attemptId: previewAttempt.id,
            quizId: previewAttempt.quiz.id,
            quizTitle: previewAttempt.quiz.title,
            attemptNumber: previewAttempt.attemptNumber,
            startedAt: startTime.toISOString(),
            completedAt: now.toISOString(),
            score: totalScore,
            percentage: percentage,
            totalQuestions: previewAttempt.totalQuestions,
            correctAnswers: correctAnswers,
            incorrectAnswers: answeredQuestions.length - correctAnswers,
            unansweredQuestions: previewAttempt.totalQuestions - answeredQuestions.length,
            passingScore: previewAttempt.quiz.passingScore,
            isPassed: percentage >= previewAttempt.quiz.passingScore,
            canRetake: true,
            remainingAttempts: null
        };
    };

    const columns = [
        {
            title: 'Tên Quiz',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            align: 'center',
            render: (type) => (
                <Tag color={type === 'ASSESSMENT' ? 'red' : 'blue'}>
                    {type === 'ASSESSMENT' ? 'Đánh giá' : 'Luyện tập'}
                </Tag>
            ),
        },
        {
            title: 'Bài học',
            dataIndex: ['lesson', 'title'],
            key: 'lessonTitle',
            width: 150,
            ellipsis: true,
            align: 'center',
        },
        {
            title: 'Số câu hỏi',
            dataIndex: 'totalQuestions',
            key: 'totalQuestions',
            width: 100,
            align: 'center',
        },
        {
            title: 'Thời gian (phút)',
            dataIndex: 'timeLimitMinutes',
            key: 'timeLimitMinutes',
            width: 120,
            align: 'center',
        },
        {
            title: 'Điểm đạt',
            dataIndex: 'passingScore',
            key: 'passingScore',
            width: 100,
            align: 'center',
            render: (score) => `${score}%`,
        },
        {
            title: 'Số lần thử',
            dataIndex: 'totalAttempts',
            key: 'totalAttempts',
            width: 100,
            align: 'center',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 100,
            align: 'center',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Tắt'}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 320,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="dashed"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Thống kê">
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={() => handleViewSummary(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Thử làm quiz">
                        <Button
                            icon={<ExperimentOutlined />}
                            onClick={() => handleStartPreview(record)}
                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                        />
                    </Tooltip>
                    <Tooltip title="Quản lý câu hỏi">
                        <Button
                            icon={<QuestionCircleOutlined />}
                            onClick={() => navigate(`/instructor/quiz-questions/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa quiz">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.isActive ? 'Tắt quiz' : 'Bật quiz'}>
                        <Button
                            icon={record.isActive ? <StopOutlined /> : <PlayCircleOutlined />}
                            onClick={() => handleToggleStatus(record)}
                            style={{ 
                                backgroundColor: record.isActive ? '#faad14' : '#52c41a',
                                borderColor: record.isActive ? '#faad14' : '#52c41a',
                                color: 'white'
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa quiz">
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

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Quản lý Quiz</h2>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingQuiz(null);
                                    form.resetFields();
                                    setModalVisible(true);
                                }}
                            >
                                Tạo Quiz Mới
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns}
                    dataSource={quizzes}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} quiz`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* Create/Edit Quiz Modal */}
            <Modal
                title={editingQuiz ? 'Sửa Quiz' : 'Tạo Quiz Mới'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingQuiz(null);
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tên Quiz"
                        rules={[{ required: true, message: 'Vui lòng nhập tên quiz!' }]}
                    >
                        <Input placeholder="Nhập tên quiz" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <TextArea rows={3} placeholder="Nhập mô tả quiz" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Loại Quiz"
                                rules={[{ required: true, message: 'Vui lòng chọn loại quiz!' }]}
                            >
                                <Select placeholder="Chọn loại quiz">
                                    <Option value="PRACTICE">Luyện tập</Option>
                                    <Option value="ASSESSMENT">Đánh giá</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="lessonId"
                                label="Bài học"
                                rules={[{ required: true, message: 'Vui lòng chọn bài học!' }]}
                            >
                                <Select placeholder="Chọn bài học">
                                    {lessons.map(lesson => (
                                        <Option key={lesson.id} value={lesson.id}>
                                            {lesson.title}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="passingScore"
                                label="Điểm đạt (%)"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm đạt!' }]}
                            >
                                <InputNumber 
                                    min={0} 
                                    max={100} 
                                    placeholder="70"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="maxAttempts"
                                label="Số lần thử tối đa"
                                rules={[{ required: true, message: 'Vui lòng nhập số lần thử!' }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    placeholder="3"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="timeLimitMinutes"
                                label="Thời gian (phút)"
                                rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    placeholder="60"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                                setEditingQuiz(null);
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingQuiz ? 'Cập nhật' : 'Tạo Quiz'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Quiz Details Modal */}
            <Modal
                title="Chi tiết Quiz"
                open={viewModalVisible}
                onCancel={() => {
                    setViewModalVisible(false);
                    setSelectedQuizDetails(null);
                }}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {loadingViewDetails ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : selectedQuizDetails ? (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Tên Quiz" span={2}>
                            {selectedQuizDetails.title}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mô tả" span={2}>
                            {selectedQuizDetails.description || 'Chưa có mô tả'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại">
                            <Tag color={selectedQuizDetails.type === 'ASSESSMENT' ? 'red' : 'blue'}>
                                {selectedQuizDetails.type === 'ASSESSMENT' ? 'Đánh giá' : 'Luyện tập'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Bài học">
                            {selectedQuizDetails.lesson?.title}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số câu hỏi">
                            {selectedQuizDetails.totalQuestions}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian">
                            {selectedQuizDetails.timeLimitMinutes} phút
                        </Descriptions.Item>
                        <Descriptions.Item label="Điểm đạt">
                            {selectedQuizDetails.passingScore}%
                        </Descriptions.Item>
                        <Descriptions.Item label="Số lần thử tối đa">
                            {selectedQuizDetails.maxAttempts}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={selectedQuizDetails.isActive ? 'green' : 'red'}>
                                {selectedQuizDetails.isActive ? 'Hoạt động' : 'Tắt'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(selectedQuizDetails.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {dayjs(selectedQuizDetails.updatedAt).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng số lần thử">
                            {selectedQuizDetails.totalAttempts || 0}
                        </Descriptions.Item>
                    </Descriptions>
                ) : null}
            </Modal>

            {/* Quiz Summary Modal */}
            <Modal
                title="Thống kê Quiz"
                open={summaryModalVisible}
                onCancel={() => {
                    setSummaryModalVisible(false);
                    setQuizSummary(null);
                }}
                footer={[
                    <Button key="close" onClick={() => setSummaryModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={900}
            >
                {loadingSummary ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : quizSummary ? (
                    <div>
                        <Row gutter={16} style={{ marginBottom: '24px' }}>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Tổng số lần thử"
                                        value={quizSummary.totalAttempts}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Số lần đạt"
                                        value={quizSummary.passedAttempts}
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Tỷ lệ đạt"
                                        value={quizSummary.totalAttempts > 0 
                                            ? Math.round((quizSummary.passedAttempts / quizSummary.totalAttempts) * 100)
                                            : 0
                                        }
                                        suffix="%"
                                        valueStyle={{ 
                                            color: quizSummary.totalAttempts > 0 && quizSummary.passedAttempts / quizSummary.totalAttempts >= 0.7
                                                ? '#52c41a' 
                                                : '#ff4d4f'
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        
                        <Card title="Thông tin chi tiết" style={{ marginBottom: '16px' }}>
                            <Descriptions bordered column={2} size="middle">
                                <Descriptions.Item label="Tên Quiz" span={2}>
                                    <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                        {quizSummary.title}
                                    </div>
                                </Descriptions.Item>
                                <Descriptions.Item label="Bài học" span={2}>
                                    <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', fontSize: '14px' }}>
                                        {quizSummary.lessonTitle || 'Chưa gán bài học'}
                                    </div>
                                </Descriptions.Item>
                                <Descriptions.Item label="Loại quiz">
                                    <Tag color={quizSummary.type === 'ASSESSMENT' ? 'red' : 'blue'}>
                                        {quizSummary.type === 'ASSESSMENT' ? 'Đánh giá' : 'Luyện tập'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={quizSummary.isActive ? 'green' : 'red'}>
                                        {quizSummary.isActive ? 'Hoạt động' : 'Tắt'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số câu hỏi">
                                    <strong>{quizSummary.totalQuestions} câu</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời gian làm bài">
                                    <strong style={{ color: '#1890ff' }}>{quizSummary.timeLimitMinutes} phút</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Điểm đạt yêu cầu">
                                    <strong style={{ color: '#52c41a' }}>{quizSummary.passingScore}%</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số lần thử tối đa">
                                    <strong>{quizSummary.maxAttempts || 'Không giới hạn'}</strong>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </div>
                ) : null}
            </Modal>

            {/* Quiz Preview Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            <ExperimentOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                            Thử làm Quiz - {previewAttempt?.quiz?.title || 'Preview Mode'}
                        </span>
                        {timeRemaining !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', color: timeRemaining < 300 ? '#ff4d4f' : '#1890ff' }}>
                                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        )}
                    </div>
                }
                open={previewModalVisible}
                onCancel={handleClosePreview}
                footer={null}
                width={1000}
                destroyOnClose
            >
                {previewLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px' }}>Đang khởi tạo quiz...</div>
                    </div>
                ) : previewResult ? (
                    // Quiz Result View
                    <div>
                        <Alert
                            message={
                                <div style={{ textAlign: 'center' }}>
                                    <Title level={3} style={{ margin: '8px 0', color: previewResult.isPassed ? '#52c41a' : '#ff4d4f' }}>
                                        {previewResult.isPassed ? (
                                            <>
                                                <CheckOutlined style={{ marginRight: '8px' }} />
                                                Chúc mừng! Bạn đã vượt qua quiz
                                            </>
                                        ) : (
                                            <>
                                                <CloseOutlined style={{ marginRight: '8px' }} />
                                                Chưa đạt yêu cầu
                                            </>
                                        )}
                                    </Title>
                                </div>
                            }
                            type={previewResult.isPassed ? 'success' : 'error'}
                            showIcon={false}
                            style={{ marginBottom: '24px' }}
                        />

                        <Row gutter={16} style={{ marginBottom: '24px' }}>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Điểm số"
                                        value={previewResult.score}
                                        precision={1}
                                        valueStyle={{ color: '#1890ff' }}
                                        suffix={`/ ${previewAttempt?.attemptAnswers?.reduce((sum, a) => sum + (a.question?.points || 0), 0) ?? 'N/A'}`}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Phần trăm"
                                        value={previewResult.percentage}
                                        precision={1}
                                        valueStyle={{ 
                                            color: previewResult.percentage >= previewAttempt?.quiz?.passingScore ? '#52c41a' : '#ff4d4f' 
                                        }}
                                        suffix="%"
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Câu đúng"
                                        value={previewResult.correctAnswers}
                                        valueStyle={{ color: '#52c41a' }}
                                        suffix={`/ ${previewResult.totalQuestions}`}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Thời gian"
                                        value={dayjs(previewResult.completedAt).diff(dayjs(previewResult.startedAt), 'second')}
                                        formatter={formatTime}
                                        valueStyle={{ color: '#fa8c16' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Kết quả chi tiết">
                            <Descriptions bordered column={2} size="middle">
                                <Descriptions.Item label="Quiz">
                                    {previewResult.quizTitle}
                                </Descriptions.Item>
                                <Descriptions.Item label="Điểm đạt yêu cầu">
                                    {previewResult.passingScore || previewAttempt?.quiz?.passingScore || 70}%
                                </Descriptions.Item>
                                <Descriptions.Item label="Bắt đầu lúc">
                                    {dayjs(previewResult.startedAt).format('DD/MM/YYYY HH:mm:ss')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Hoàn thành lúc">
                                    {dayjs(previewResult.completedAt).format('DD/MM/YYYY HH:mm:ss')}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Button type="primary" size="large" onClick={handleClosePreview}>
                                Đóng Preview
                            </Button>
                        </div>
                    </div>
                ) : previewAttempt && (
                    // Quiz Taking View
                    <div>
                        {/* Progress Bar */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text strong>Tiến độ làm bài</Text>
                                <Text>{getAnsweredQuestionsCount()} / {previewAttempt.totalQuestions} câu đã trả lời</Text>
                            </div>
                            <Progress 
                                percent={Math.round((getAnsweredQuestionsCount() / previewAttempt.totalQuestions) * 100)}
                                strokeColor={{
                                    from: '#108ee9',
                                    to: '#87d068',
                                }}
                            />
                        </div>

                        {/* Question Navigation */}
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text strong>Câu hỏi {currentQuestionIndex + 1} / {previewAttempt.totalQuestions}</Text>
                                </div>
                                <Space>
                                    <Button 
                                        size="small"
                                        disabled={currentQuestionIndex === 0}
                                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                    >
                                        ← Trước
                                    </Button>
                                    <Button 
                                        size="small"
                                        disabled={currentQuestionIndex === previewAttempt.totalQuestions - 1}
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                    >
                                        Sau →
                                    </Button>
                                </Space>
                            </div>
                        </Card>

                        {/* Current Question */}
                        {getCurrentQuestion() ? (
                            <Card title={`Câu ${currentQuestionIndex + 1}`} style={{ marginBottom: '24px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <KatexRenderer 
                                        content={getCurrentQuestion().question.questionText}
                                        style={{ fontSize: '16px', lineHeight: '1.6' }}
                                    />
                                    <div style={{ marginTop: '8px' }}>
                                        <Tag color="blue">Điểm: {getCurrentQuestion().question.points}</Tag>
                                    </div>
                                </div>

                                <Radio.Group
                                    value={previewAnswers[getCurrentQuestion().question.id]?.selectedAnswer?.id}
                                    onChange={(e) => handleAnswerQuestion(getCurrentQuestion().question.id, e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {getCurrentQuestion().question.answers
                                            .sort((a, b) => a.orderIndex - b.orderIndex)
                                            .map((answer) => (
                                                <Radio 
                                                    key={answer.id} 
                                                    value={answer.id}
                                                    style={{ 
                                                        padding: '12px',
                                                        border: '1px solid #d9d9d9',
                                                        borderRadius: '6px',
                                                        width: '100%',
                                                        margin: '4px 0'
                                                    }}
                                                >
                                                    <KatexRenderer
                                                        content={answer.answerText}
                                                        style={{ marginLeft: '8px', lineHeight: '1.5' }}
                                                    />
                                                </Radio>
                                            ))
                                        }
                                    </Space>
                                </Radio.Group>

                                {/* Show answer feedback in preview mode */}
                                {previewAnswers[getCurrentQuestion().question.id] && (
                                    <Alert
                                        message={
                                            previewAnswers[getCurrentQuestion().question.id].isCorrect 
                                                ? `Chính xác! (+${previewAnswers[getCurrentQuestion().question.id].pointsEarned} điểm)`
                                                : 'Sai rồi! (+0 điểm)'
                                        }
                                        type={previewAnswers[getCurrentQuestion().question.id].isCorrect ? 'success' : 'error'}
                                        showIcon
                                        style={{ marginTop: '16px' }}
                                    />
                                )}
                            </Card>
                        ) : (
                            <Card title={`Câu ${currentQuestionIndex + 1}`} style={{ marginBottom: '24px' }}>
                                <Alert
                                    message="Không thể tải câu hỏi"
                                    description="Dữ liệu câu hỏi không có sẵn. Vui lòng kiểm tra console để debug."
                                    type="warning"
                                    showIcon
                                />
                                <div style={{ marginTop: '16px' }}>
                                    <Text type="secondary">
                                        Debug info: currentQuestionIndex = {currentQuestionIndex}, 
                                        totalQuestions = {previewAttempt?.totalQuestions}, 
                                        attemptAnswers = {previewAttempt?.attemptAnswers ? `array(${previewAttempt.attemptAnswers.length})` : 'null/empty'}
                                    </Text>
                                </div>
                            </Card>
                        )}

                        {/* Question Overview */}
                        <Card title="Tổng quan câu hỏi" size="small" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {previewAttempt.attemptAnswers && previewAttempt.attemptAnswers.length > 0 ? (
                                    previewAttempt.attemptAnswers.map((attemptAnswer, index) => {
                                        const isAnswered = previewAnswers[attemptAnswer.question.id];
                                        const isCurrent = index === currentQuestionIndex;
                                        return (
                                            <Button
                                                key={attemptAnswer.question.id}
                                                size="small"
                                                type={isCurrent ? 'primary' : isAnswered ? 'default' : 'dashed'}
                                                style={{
                                                    backgroundColor: isAnswered && !isCurrent ? '#52c41a' : undefined,
                                                    borderColor: isAnswered && !isCurrent ? '#52c41a' : undefined,
                                                    color: isAnswered && !isCurrent ? 'white' : undefined
                                                }}
                                                onClick={() => setCurrentQuestionIndex(index)}
                                            >
                                                {index + 1}
                                            </Button>
                                        );
                                    })
                                ) : (
                                    // Fallback: Generate buttons based on totalQuestions
                                    Array.from({ length: previewAttempt.totalQuestions || 0 }, (_, index) => {
                                        const isCurrent = index === currentQuestionIndex;
                                        // Check if this question index has been answered
                                        const isAnswered = Object.keys(previewAnswers).some(questionId => 
                                            previewAnswers[questionId]
                                        );
                                        
                                        return (
                                            <Button
                                                key={index}
                                                size="small"
                                                type={isCurrent ? 'primary' : isAnswered ? 'default' : 'dashed'}
                                                style={{
                                                    backgroundColor: isAnswered && !isCurrent ? '#52c41a' : undefined,
                                                    borderColor: isAnswered && !isCurrent ? '#52c41a' : undefined,
                                                    color: isAnswered && !isCurrent ? 'white' : undefined
                                                }}
                                                onClick={() => setCurrentQuestionIndex(index)}
                                            >
                                                {index + 1}
                                            </Button>
                                        );
                                    })
                                )}
                            </div>
                        </Card>

                        {/* Submit Button */}
                        <div style={{ textAlign: 'center' }}>
                            <Space size="large">
                                <Button size="large" onClick={handleClosePreview}>
                                    Hủy Preview
                                </Button>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    onClick={() => handleSubmitPreview()}
                                    disabled={getAnsweredQuestionsCount() === 0}
                                >
                                    Nộp bài ({getAnsweredQuestionsCount()} / {previewAttempt.totalQuestions})
                                </Button>
                                <Button 
                                    type="dashed" 
                                    size="large" 
                                    onClick={() => {
                                        const localResult = calculateLocalPreviewResult();
                                        if (localResult) {
                                            setPreviewResult(localResult);
                                            if (timerRef.current) {
                                                clearInterval(timerRef.current);
                                            }
                                            message.success('Đã tính kết quả cục bộ!');
                                        }
                                    }}
                                    disabled={getAnsweredQuestionsCount() === 0}
                                >
                                    Tính kết quả cục bộ
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default QuizManagement; 
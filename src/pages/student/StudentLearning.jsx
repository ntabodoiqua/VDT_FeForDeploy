import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Card, 
    Image, 
    Typography, 
    Space, 
    Button, 
    Empty, 
    Spin, 
    message, 
    Tag, 
    Divider,
    Row,
    Col,
    Avatar,
    List,
    Progress,
    Menu,
    Affix,
    Drawer,
    Modal,
    Radio,
    Alert,
    Statistic
} from 'antd';
import { 
    ArrowLeftOutlined, 
    BookOutlined, 
    UserOutlined, 
    ClockCircleOutlined,
    PlayCircleOutlined,
    FileTextOutlined,
    DownloadOutlined,
    FilePdfOutlined,
    PictureOutlined,
    MenuOutlined,
    CheckCircleOutlined,
    RightOutlined,
    LeftOutlined,
    EyeOutlined,
    QuestionCircleOutlined,
    UnorderedListOutlined,
    CloseOutlined,
    HistoryOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
    fetchCourseByIdApi, 
    fetchPublicLessonsForCourseApi, 
    fetchCourseDocumentsApi, 
    downloadCourseDocumentApi,
    fetchLessonByIdApi,
    fetchLessonDocumentsApi,
    downloadLessonDocumentApi,
    trackDocumentViewApi,
    startQuizAttemptApi,
    getCurrentQuizAttemptApi,
    answerQuestionApi,
    submitQuizAttemptApi,
    fetchMyEnrollmentForCourseApi,
    fetchEnrollmentProgressApi,
    autoCompleteEmptyLessonApi,
    fetchQuizByIdApi,
    fetchCourseQuizzesApi,
    getQuizAttemptHistoryApi,
    getBestQuizScoreApi
} from '../../util/api';

const { Title, Text, Paragraph } = Typography;

const StudentLearning = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [lessonDocuments, setLessonDocuments] = useState([]);
    const [courseDocuments, setCourseDocuments] = useState([]);
    const [courseQuizzes, setCourseQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lessonLoading, setLessonLoading] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // New states for tracking real progress
    const [enrollment, setEnrollment] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [progressLoading, setProgressLoading] = useState(false);

    const [documentPreviewVisible, setDocumentPreviewVisible] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [quizVisible, setQuizVisible] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [quizAttempt, setQuizAttempt] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [timerActive, setTimerActive] = useState(false);
    const [quizHistory, setQuizHistory] = useState([]);
    const [bestScore, setBestScore] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [quizCompletionStatus, setQuizCompletionStatus] = useState({}); // Track quiz completion for each lesson

    const getDisplayImageUrl = (urlPath) => {
        if (!urlPath) return null;
        if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
        if (urlPath.startsWith('/')) {
            const API_IMAGE_BASE_URL = 'http://localhost:8080/lms';
            return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
        }
        return urlPath; 
    };

    const getQuizForLesson = (lessonId) => {
        if (!courseQuizzes || courseQuizzes.length === 0) return null;
        return courseQuizzes.find(quiz => quiz.lesson?.id === lessonId);
    };

    const initializeTimer = (quiz, attemptStartTime) => {
        if (!quiz.timeLimitMinutes) {
            setTimeRemaining(null);
            setTimerActive(false);
            return;
        }

        const startTime = attemptStartTime ? new Date(attemptStartTime) : new Date();
        const timeLimitMs = quiz.timeLimitMinutes * 60 * 1000;
        const elapsed = Date.now() - startTime.getTime();
        const remaining = Math.max(0, Math.floor((timeLimitMs - elapsed) / 1000));

        setTimeRemaining(remaining);
        setTimerActive(remaining > 0);
    };

    const formatTime = (seconds) => {
        if (seconds === null) return null;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <PictureOutlined style={{ color: '#52c41a' }} />;
            case 'doc':
            case 'docx':
                return <FileTextOutlined style={{ color: '#1890ff' }} />;
            case 'mp4':
            case 'avi':
            case 'mov':
                return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
            default:
                return <FileTextOutlined style={{ color: '#666' }} />;
        }
    };

    const getOriginalFileName = (fileName) => {
        if (!fileName) return fileName;
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
        return fileName.replace(uuidPattern, '');
    };

    const truncateFileName = (fileName, maxLength = 30) => {
        const originalName = getOriginalFileName(fileName);
        if (!originalName || originalName.length <= maxLength) return originalName;
        
        const extension = originalName.split('.').pop();
        const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));
        
        if (nameWithoutExtension.length <= maxLength - extension.length - 4) return originalName;
        
        const truncatedName = nameWithoutExtension.substring(0, maxLength - extension.length - 4);
        return `${truncatedName}...${extension}`;
    };

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const [courseResponse, lessonsResponse, documentsResponse, quizzesResponse] = await Promise.all([
                fetchCourseByIdApi(courseId),
                fetchPublicLessonsForCourseApi(courseId, { page: 0, size: 1000 }),
                fetchCourseDocumentsApi(courseId),
                fetchCourseQuizzesApi(courseId)
            ]);

            // Set course info
            if (courseResponse.code === 1000 && courseResponse.result) {
                setCourse(courseResponse.result);
            }

            // Set course documents
            if (documentsResponse.code === 1000 && documentsResponse.result) {
                setCourseDocuments(documentsResponse.result);
            }

            // Set course quizzes FIRST before loading lessons
            let quizzesData = [];
            if (quizzesResponse.code === 1000 && quizzesResponse.result) {
                quizzesData = quizzesResponse.result;
                setCourseQuizzes(quizzesData);
                console.log('Course quizzes loaded:', quizzesData);
            }

            // Set lessons and load first lesson AFTER quizzes are set
            if (lessonsResponse.code === 1000 && lessonsResponse.result) {
                let lessonsData = lessonsResponse.result;
                if (lessonsData.content && Array.isArray(lessonsData.content)) {
                    lessonsData = lessonsData.content;
                }
                
                if (Array.isArray(lessonsData)) {
                    const sortedLessons = lessonsData.sort((a, b) => {
                        const orderA = a.orderIndex || a.displayOrder || 0;
                        const orderB = b.orderIndex || b.displayOrder || 0;
                        return orderA - orderB;
                    });
                    setLessons(sortedLessons);
                    
                    // Load first lesson by default - now quizzes are already available
                    if (sortedLessons.length > 0) {
                        await loadLessonWithQuizzes(sortedLessons[0], 0, quizzesData);
                    }
                }
            }

            // Fetch enrollment and progress data
            await fetchEnrollmentAndProgress();

        } catch (error) {
            message.error('Không thể tải thông tin khóa học: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Load quiz completion status after course details are loaded
    useEffect(() => {
        if (lessons.length > 0 && courseQuizzes.length > 0) {
            loadAllQuizCompletionStatus();
        }
    }, [lessons, courseQuizzes]);

    const fetchEnrollmentAndProgress = async () => {
        try {
            setProgressLoading(true);
            
            // Get enrollment data for this course
            const enrollmentResponse = await fetchMyEnrollmentForCourseApi(courseId);
            if (enrollmentResponse.code === 1000 && enrollmentResponse.result) {
                setEnrollment(enrollmentResponse.result);
                
                // Get detailed progress data
                const progressResponse = await fetchEnrollmentProgressApi(enrollmentResponse.result.id);
                if (progressResponse.code === 1000 && progressResponse.result) {
                    setProgressData(progressResponse.result);
                }
            }
        } catch (error) {
            console.error('Error fetching enrollment/progress:', error);
            // Don't show error to user as this is supplementary data
        } finally {
            setProgressLoading(false);
        }
    };

    // Helper function to find quiz from specific quizzes data
    const getQuizForLessonFromData = (lessonId, quizzesData) => {
        if (!quizzesData || quizzesData.length === 0) return null;
        return quizzesData.find(quiz => quiz.lesson?.id === lessonId);
    };

    // Load lesson with quiz data passed directly (for initial load)
    const loadLessonWithQuizzes = async (lesson, index, quizzesData) => {
        setLessonLoading(true);
        setCurrentLessonIndex(index);
        
        // Clear quiz-related state when switching lessons
        setBestScore(null);
        setQuizHistory([]);
        
        try {
            const lessonId = lesson.lesson?.id || lesson.lessonId || lesson.id;
            const lessonResponse = await fetchLessonByIdApi(lessonId);
            
            if (lessonResponse.code === 1000 && lessonResponse.result) {
                const lessonData = lessonResponse.result;
                
                // Find and attach quiz for this lesson using passed quizzes data
                const quiz = getQuizForLessonFromData(lessonData.id, quizzesData);
                if (quiz) {
                    lessonData.quiz = quiz;
                    console.log('Quiz attached to lesson during initial load:', quiz.title);
                    
                    // Load quiz history and best score if quiz exists
                    await loadQuizHistory(quiz.id, lessonData.id);
                }
                
                setCurrentLesson(lessonData);
                
                // Load lesson documents
                let documentsData = [];
                try {
                    const documentsResponse = await fetchLessonDocumentsApi(lessonId);
                    if (documentsResponse.code === 1000 && documentsResponse.result) {
                        documentsData = documentsResponse.result;
                        setLessonDocuments(documentsData);
                    } else {
                        setLessonDocuments([]);
                    }
                } catch (docError) {
                    setLessonDocuments([]);
                }
                
                // Auto-complete lesson if it has no quiz and no documents
                if (enrollment?.id) {
                    const currentLessonData = lessonResponse.result;
                    const hasQuiz = getQuizForLessonFromData(currentLessonData.id, quizzesData) !== null;
                    const hasDocuments = documentsData && documentsData.length > 0;
                    
                    if (!hasQuiz && !hasDocuments) {
                        try {
                            await autoCompleteEmptyLessonApi(enrollment.id, lessonId);
                            // Refresh progress after auto-completion
                            await fetchEnrollmentAndProgress();
                            message.success('Bài học đã được tự động hoàn thành!');
                        } catch (error) {
                            console.error('Failed to auto-complete lesson:', error);
                        }
                    }
                }
            }
        } catch (error) {
            message.error('Không thể tải bài học: ' + error.message);
        } finally {
            setLessonLoading(false);
        }
    };

    // Regular load lesson function (uses state courseQuizzes)
    const loadLesson = async (lesson, index) => {
        setLessonLoading(true);
        setCurrentLessonIndex(index);
        
        // Clear quiz-related state when switching lessons
        setBestScore(null);
        setQuizHistory([]);
        
        try {
            const lessonId = lesson.lesson?.id || lesson.lessonId || lesson.id;
            const lessonResponse = await fetchLessonByIdApi(lessonId);
            
            if (lessonResponse.code === 1000 && lessonResponse.result) {
                const lessonData = lessonResponse.result;
                
                // Find and attach quiz for this lesson
                const quiz = getQuizForLesson(lessonData.id);
                if (quiz) {
                    lessonData.quiz = quiz;
                    console.log('Quiz attached to lesson:', quiz.title);
                    
                    // Load quiz history and best score if quiz exists
                    await loadQuizHistory(quiz.id, lessonData.id);
                }
                
                setCurrentLesson(lessonData);
                
                // Load lesson documents
                let documentsData = [];
                try {
                    const documentsResponse = await fetchLessonDocumentsApi(lessonId);
                    if (documentsResponse.code === 1000 && documentsResponse.result) {
                        documentsData = documentsResponse.result;
                        setLessonDocuments(documentsData);
                    } else {
                        setLessonDocuments([]);
                    }
                } catch (docError) {
                    setLessonDocuments([]);
                }
                
                // Auto-complete lesson if it has no quiz and no documents
                if (enrollment?.id) {
                    const currentLessonData = lessonResponse.result;
                    const hasQuiz = getQuizForLesson(currentLessonData.id) !== null;
                    const hasDocuments = documentsData && documentsData.length > 0;
                    
                    if (!hasQuiz && !hasDocuments) {
                        try {
                            await autoCompleteEmptyLessonApi(enrollment.id, lessonId);
                            // Refresh progress after auto-completion
                            await fetchEnrollmentAndProgress();
                            message.success('Bài học đã được tự động hoàn thành!');
                        } catch (error) {
                            console.error('Failed to auto-complete lesson:', error);
                        }
                    }
                }
            }
        } catch (error) {
            message.error('Không thể tải bài học: ' + error.message);
        } finally {
            setLessonLoading(false);
        }
    };

    const handleLessonSelect = (lesson, index) => {
        loadLesson(lesson, index);
        setSidebarVisible(false);
    };

    const handleNextLesson = () => {
        if (currentLessonIndex < lessons.length - 1) {
            const nextIndex = currentLessonIndex + 1;
            loadLesson(lessons[nextIndex], nextIndex);
        }
    };

    const handlePrevLesson = () => {
        if (currentLessonIndex > 0) {
            const prevIndex = currentLessonIndex - 1;
            loadLesson(lessons[prevIndex], prevIndex);
        }
    };

    const handleDocumentDownload = async (doc, isLessonDoc = false) => {
        try {
            const response = isLessonDoc 
                ? await downloadLessonDocumentApi(currentLesson.id, doc.id)
                : await downloadCourseDocumentApi(courseId, doc.id);
                
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.fileName || doc.originalFileName || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            // Track document view nếu là lesson document
            if (isLessonDoc) {
                try {
                    await trackDocumentViewApi(doc.id);
                    message.success('Tải xuống thành công - Tiến độ đã được cập nhật');
                    // Refresh enrollment progress after tracking document view
                    await fetchEnrollmentAndProgress();
                } catch (trackError) {
                    console.error('Failed to track document view:', trackError);
                    message.success('Tải xuống thành công');
                }
            } else {
                message.success('Tải xuống thành công');
            }
        } catch (error) {
            message.error('Không thể tải xuống tài liệu');
        }
    };

    // Document preview functions
    const handleDocumentPreview = async (doc, isLessonDoc = false) => {
        try {
            setPreviewDocument(doc);
            setDocumentPreviewVisible(true);
            
            const response = isLessonDoc 
                ? await downloadLessonDocumentApi(currentLesson.id, doc.id)
                : await downloadCourseDocumentApi(courseId, doc.id);
            
            const blob = response.data || response;
            
            // Xác định file type từ filename hoặc blob type
            const fileName = doc.originalFileName || doc.fileName || '';
            const fileExtension = fileName.toLowerCase().split('.').pop();
            
            // Kiểm tra xem file có thể preview được không
            const previewableTypes = ['pdf', 'txt', 'html', 'htm'];
            const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
            
            if (imageTypes.includes(fileExtension)) {
                // Với images, tạo blob URL với type phù hợp
                const imageBlob = new Blob([blob], { type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}` });
                const url = window.URL.createObjectURL(imageBlob);
                setPreviewUrl(url);
            } else if (previewableTypes.includes(fileExtension)) {
                // Với PDF, text files - tạo blob với correct MIME type
                let mimeType = 'application/octet-stream'; // default
                if (fileExtension === 'pdf') {
                    mimeType = 'application/pdf';
                } else if (fileExtension === 'txt') {
                    mimeType = 'text/plain';
                } else if (fileExtension === 'html' || fileExtension === 'htm') {
                    mimeType = 'text/html';
                }
                
                const typedBlob = new Blob([blob], { type: mimeType });
                const url = window.URL.createObjectURL(typedBlob);
                setPreviewUrl(url);
            } else {
                // Với các file khác (Word, Excel, v.v.) - không thể preview
                message.warning(`Không thể xem trước file ${fileExtension.toUpperCase()}. Vui lòng tải xuống để xem.`);
                setDocumentPreviewVisible(false);
                return;
            }

            // Track document view nếu là lesson document
            if (isLessonDoc) {
                try {
                    await trackDocumentViewApi(doc.id);
                    message.success('Đã xem tài liệu - Tiến độ đã được cập nhật');
                    // Refresh enrollment progress after tracking document view
                    await fetchEnrollmentAndProgress();
                } catch (trackError) {
                    console.error('Failed to track document view:', trackError);
                    // Không hiển thị lỗi tracking cho user
                }
            }
        } catch (error) {
            message.error('Không thể xem trước tài liệu');
            setDocumentPreviewVisible(false);
        }
    };

    const handleCloseDocumentPreview = () => {
        setDocumentPreviewVisible(false);
        setPreviewDocument(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    // Quiz functions
    const handleStartQuiz = async () => {
        if (!currentLesson?.quiz) {
            console.log('No quiz found for current lesson');
            return;
        }
        
        setQuizLoading(true);
        try {
            // Kiểm tra xem có attempt in-progress không
            try {
                const currentAttemptResponse = await getCurrentQuizAttemptApi(currentLesson.quiz.id, courseId);
                if (currentAttemptResponse.code === 1000 && currentAttemptResponse.result) {
                    // Có attempt in-progress, tiếp tục với attempt đó
                    const attemptData = currentAttemptResponse.result;
                    setQuizAttempt(attemptData);
                    
                    // Ensure quiz has full question data
                    let quizWithQuestions = attemptData.quiz;
                    if (!quizWithQuestions.questions || quizWithQuestions.questions.length === 0) {
                        // Use the quiz details we already fetched earlier
                        quizWithQuestions = quizDetails;
                    }
                    
                    setCurrentQuiz(quizWithQuestions);
                    setQuizVisible(true);
                    setCurrentQuestionIndex(0);
                    
                    // Initialize timer for existing attempt
                    initializeTimer(quizWithQuestions, attemptData.startedAt);
                    
                    // Load existing answers từ attemptAnswers
                    const existingAnswers = {};
                    if (attemptData.attemptAnswers && Array.isArray(attemptData.attemptAnswers)) {
                        attemptData.attemptAnswers.forEach(attemptAnswer => {
                            if (attemptAnswer.selectedAnswer) {
                                existingAnswers[attemptAnswer.question.id] = attemptAnswer.selectedAnswer.id;
                            }
                        });
                    }
                    setQuizAnswers(existingAnswers);
                    setQuizResult(null);
                    
                    message.info('Tiếp tục với quiz đang làm dở', 3);
                    return;
                }
            } catch (error) {
                // Handle specific error cases
                if (error.response?.status === 404) {
                    // No active attempt found (expected behavior)
                    console.log('No active attempt found, creating new one');
                } else {
                    // Other errors
                    console.error('Error checking current attempt:', error);
                }
            }
            
            // Fetch quiz details đầy đủ trước khi start (theo documentation)
            let quizDetails = currentLesson.quiz;
            try {
                const quizResponse = await fetchQuizByIdApi(currentLesson.quiz.id);
                if (quizResponse.code === 1000 && quizResponse.result) {
                    quizDetails = quizResponse.result;
                    console.log('Fetched full quiz details with questions:', quizDetails.questions?.length || 0);
                } else {
                    console.log('Using lesson quiz data as fallback');
                }
            } catch (error) {
                console.error('Error fetching quiz details:', error);
                message.warning('Không thể tải chi tiết quiz, sử dụng dữ liệu cơ bản');
            }
            
            // Kiểm tra điều kiện quiz theo documentation
            if (!quizDetails.isActive) {
                message.error('Quiz này hiện không khả dụng');
                return;
            }
            
            if (quizDetails.startTime && new Date() < new Date(quizDetails.startTime)) {
                message.error('Quiz chưa đến thời gian mở');
                return;
            }
            
            if (quizDetails.endTime && new Date() > new Date(quizDetails.endTime)) {
                message.error('Quiz đã hết thời gian');
                return;
            }
            
            // Tạo attempt mới
            const startResponse = await startQuizAttemptApi(currentLesson.quiz.id, courseId);
            if (startResponse.code === 1000 && startResponse.result) {
                const attemptData = startResponse.result;
                setQuizAttempt(attemptData);
                
                // Ensure quiz has full question data
                let quizWithQuestions = attemptData.quiz;
                if (!quizWithQuestions.questions || quizWithQuestions.questions.length === 0) {
                    // Use the quiz details we already fetched earlier
                    quizWithQuestions = quizDetails;
                }
                
                setCurrentQuiz(quizWithQuestions);
                setQuizVisible(true);
                setCurrentQuestionIndex(0);
                setQuizAnswers({});
                setQuizResult(null);
                
                // Initialize timer for new attempt
                initializeTimer(quizWithQuestions, new Date());
                
                message.success('Đã bắt đầu quiz mới!', 2);
            } else {
                // Handle error response theo documentation
                message.error(startResponse.message || 'Không thể bắt đầu quiz');
            }
        } catch (error) {
            console.error('Error starting quiz:', error);
            // Handle specific error codes theo documentation
            if (error.response?.status === 400) {
                const errorData = error.response?.data;
                if (errorData?.code === 1067) { // QUIZ_MAX_ATTEMPTS_EXCEEDED
                    message.error('Bạn đã hết lượt làm quiz này');
                } else if (errorData?.code === 1060) { // QUIZ_NOT_AVAILABLE
                    message.error('Quiz này hiện không khả dụng');
                } else {
                    message.error(errorData?.message || 'Bạn đã hết lượt làm quiz');
                }
            } else {
                message.error('Có lỗi xảy ra khi bắt đầu quiz');
            }
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAnswerQuestion = async (questionId, answerId) => {
        // Update local state immediately for better UX
        setQuizAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
        
        // Call backend API to save answer nếu có attempt
        if (quizAttempt?.id) {
            try {
                const response = await answerQuestionApi(quizAttempt.id, questionId, answerId);
                if (response.code === 1000 && response.result) {
                    const answerData = response.result;
                    
                    // Log answer details for debugging (có thể remove trong production)
                    console.log(`Question answered: ${answerData.question.questionText}`);
                    console.log(`Selected: ${answerData.selectedAnswer.answerText}`);
                    console.log(`Correct: ${answerData.isCorrect ? 'YES' : 'NO'}`);
                    console.log(`Points earned: ${answerData.pointsEarned}/${answerData.question.points}`);
                    
                    // Update quiz attempt data nếu cần thiết
                    // (Không cần update UI vì đã update local state)
                    
                } else {
                    // API call thất bại nhưng không ảnh hưởng UX
                    console.warn('Failed to save answer to backend:', response.message);
                }
            } catch (error) {
                // Handle specific error codes theo documentation
                if (error.response?.status === 400) {
                    const errorData = error.response?.data;
                    if (errorData?.code === 1069) { // QUIZ_ATTEMPT_NOT_IN_PROGRESS
                        message.error('Quiz đã kết thúc, không thể trả lời thêm câu hỏi');
                        setQuizVisible(false); // Close quiz modal
                    } else if (errorData?.code === 1068) { // QUIZ_ATTEMPT_NOT_FOUND
                        message.error('Không tìm thấy thông tin bài làm');
                        setQuizVisible(false);
                    } else {
                        console.error('Error saving answer:', errorData?.message || error.message);
                        // Không hiển thị error cho user vì đây là auto-save
                    }
                } else {
                    console.error('Network error saving answer:', error);
                    // Không hiển thị error cho user, chỉ log
                }
            }
        } else {
            console.warn('No quiz attempt found, answer saved locally only');
        }
    };

    const handleSubmitQuiz = async () => {
        if (!quizAttempt?.id) {
            message.error('Không tìm thấy thông tin bài làm');
            return;
        }
        
        setQuizLoading(true);
        try {
            const submitResponse = await submitQuizAttemptApi(quizAttempt.id);
            if (submitResponse.code === 1000 && submitResponse.result) {
                const result = submitResponse.result;
                
                // Convert backend response to frontend format theo documentation
                setQuizResult({
                    attemptId: result.attemptId,
                    quizTitle: result.quizTitle,
                    attemptNumber: result.attemptNumber,
                    startedAt: result.startedAt,
                    completedAt: result.completedAt,
                    durationMinutes: result.durationMinutes,
                    score: result.score,
                    totalPossibleScore: result.totalQuestions > 0 ? 
                        (result.score / (result.percentage / 100)) : result.score, // Calculate from percentage
                    percentage: result.percentage?.toFixed(1) || '0.0',
                    correctAnswers: result.correctAnswers || 0,
                    totalQuestions: result.totalQuestions || 0,
                    incorrectAnswers: result.incorrectAnswers || 0,
                    unansweredQuestions: result.unansweredQuestions || 0,
                    isPassed: result.isPassed || false,
                    passingScore: result.passingScore || 70,
                    canRetake: result.canRetake || false,
                    remainingAttempts: result.remainingAttempts || 0,
                    feedback: result.feedback || ''
                });
                
                // Reload lesson to update progress
                if (lessons[currentLessonIndex]) {
                    console.log('Reloading lesson after quiz submit to update progress');
                    await loadLesson(lessons[currentLessonIndex], currentLessonIndex);
                }
                
                // Refresh enrollment and progress data
                await fetchEnrollmentAndProgress();
                
                // Update quiz completion status if passed
                if (result.isPassed && currentLesson?.id) {
                    console.log('Updating quiz completion status for lesson:', currentLesson.id);
                    setQuizCompletionStatus(prev => ({
                        ...prev,
                        [currentLesson.id]: true
                    }));
                }
                
                // Show success message with result
                const resultMessage = result.isPassed ? 
                    `Chúc mừng! Bạn đã đạt ${result.percentage?.toFixed(1)}%` :
                    `Bạn đạt ${result.percentage?.toFixed(1)}% (cần ${result.passingScore}% để đạt)`;
                message.success(`Đã nộp bài thành công! ${resultMessage}`, 4);
            } else {
                // Handle error response theo documentation
                message.error(submitResponse.message || 'Có lỗi xảy ra khi nộp bài');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            // Handle specific error codes
            if (error.response?.status === 400) {
                const errorData = error.response?.data;
                if (errorData?.code === 1069) { // QUIZ_ATTEMPT_NOT_IN_PROGRESS
                    message.error('Quiz attempt không trong trạng thái IN_PROGRESS');
                } else if (errorData?.code === 1070) { // QUIZ_ATTEMPT_EXPIRED
                    message.error('Quiz đã hết thời gian làm bài');
                } else {
                    message.error(errorData?.message || 'Có lỗi xảy ra khi nộp bài');
                }
            } else {
                message.error('Có lỗi xảy ra khi nộp bài');
            }
        } finally {
            setQuizLoading(false);
        }
    };

    const handleCloseQuiz = () => {
        setQuizVisible(false);
        setCurrentQuiz(null);
        setQuizAttempt(null);
        setCurrentQuestionIndex(0);
        setQuizAnswers({});
        setQuizResult(null);
        setQuizLoading(false);
        setTimeRemaining(null);
        setTimerActive(false);
    };

    // Load quiz history and best score
    const loadQuizHistory = async (quizId, lessonId = null) => {
        if (!quizId || !courseId) {
            console.warn('loadQuizHistory: Missing quizId or courseId', { quizId, courseId });
            return;
        }
        
        console.log('Loading quiz history for:', { quizId, courseId, lessonId });
        setHistoryLoading(true);
        try {
            const [historyResponse, bestScoreResponse] = await Promise.all([
                getQuizAttemptHistoryApi(quizId, courseId),
                getBestQuizScoreApi(quizId, courseId).catch(() => null) // Best score might not exist
            ]);

            if (historyResponse.code === 1000 && historyResponse.result) {
                setQuizHistory(historyResponse.result);
            } else {
                setQuizHistory([]);
            }

            let bestScoreData = null;
            if (bestScoreResponse?.code === 1000 && bestScoreResponse.result) {
                bestScoreData = bestScoreResponse.result;
                setBestScore(bestScoreData);
            } else {
                setBestScore(null);
            }

            // Update quiz completion status for this lesson
            if (lessonId && bestScoreData) {
                setQuizCompletionStatus(prev => ({
                    ...prev,
                    [lessonId]: bestScoreData.isPassed
                }));
            }
        } catch (error) {
            console.error('Error loading quiz history:', error);
            setQuizHistory([]);
            setBestScore(null);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewHistory = () => {
        if (currentLesson?.quiz) {
            loadQuizHistory(currentLesson.quiz.id);
            setHistoryVisible(true);
        }
    };

    // Load quiz completion status for all lessons
    const loadAllQuizCompletionStatus = async () => {
        if (!lessons || lessons.length === 0 || !courseQuizzes) {
            console.log('loadAllQuizCompletionStatus: Skipping - missing data', { 
                lessonsCount: lessons?.length, 
                quizzesCount: courseQuizzes?.length 
            });
            return;
        }
        
        console.log('Loading quiz completion status for all lessons in course:', courseId);
        
        const completionPromises = lessons.map(async (lesson) => {
            const lessonId = lesson.lesson?.id || lesson.id;
            const quiz = getQuizForLesson(lessonId);
            
            if (quiz) {
                try {
                    console.log(`Loading best score for lesson ${lessonId}, quiz ${quiz.id} in course ${courseId}`);
                    const bestScoreResponse = await getBestQuizScoreApi(quiz.id, courseId);
                    if (bestScoreResponse?.code === 1000 && bestScoreResponse.result) {
                        console.log(`Best score found for lesson ${lessonId}:`, bestScoreResponse.result);
                        return {
                            lessonId,
                            isPassed: bestScoreResponse.result.isPassed
                        };
                    }
                } catch (error) {
                    console.error(`Error loading best score for lesson ${lessonId}:`, error);
                }
            }
            return { lessonId, isPassed: false };
        });

        try {
            const results = await Promise.all(completionPromises);
            const statusMap = {};
            results.forEach(result => {
                statusMap[result.lessonId] = result.isPassed;
            });
            setQuizCompletionStatus(statusMap);
        } catch (error) {
            console.error('Error loading quiz completion status:', error);
        }
    };

    const handleCloseHistory = () => {
        setHistoryVisible(false);
    };

    const getCurrentQuestion = () => {
        if (!currentQuiz) {
            console.warn('getCurrentQuestion: No currentQuiz');
            return null;
        }
        
        // Handle different quiz data sources
        let questions = null;
        
        // Try to get questions from currentQuiz (from API response)
        if (currentQuiz.questions && Array.isArray(currentQuiz.questions)) {
            questions = currentQuiz.questions;
            console.log('Using questions from currentQuiz.questions:', questions.length);
        }
        // Fallback: try to get from quizAttempt.attemptAnswers (for student view)
        else if (quizAttempt?.attemptAnswers && Array.isArray(quizAttempt.attemptAnswers)) {
            questions = quizAttempt.attemptAnswers
                .map(attemptAnswer => attemptAnswer.question)
                .filter(q => q != null) // Remove null questions
                .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)); // Sort by orderIndex
            console.log('Using questions from quizAttempt.attemptAnswers:', questions.length);
        }
        
        if (!questions || questions.length === 0) {
            console.warn('No questions found in currentQuiz or quizAttempt');
            console.warn('currentQuiz:', currentQuiz);
            console.warn('quizAttempt:', quizAttempt);
            return null;
        }
        
        // Validate currentQuestionIndex
        if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
            console.warn(`Invalid question index: ${currentQuestionIndex}, total questions: ${questions.length}`);
            return null;
        }
        
        const question = questions[currentQuestionIndex];
        
        // Ensure question has required properties
        if (!question || !question.id) {
            console.warn('Invalid question data:', question);
            return null;
        }
        
        // Sort answers by orderIndex if available
        if (question.answers && Array.isArray(question.answers)) {
            question.answers = question.answers.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        }
        
        return question;
    };

    const getAnsweredQuestionsCount = () => {
        if (!quizAnswers) return 0;
        return Object.keys(quizAnswers).filter(questionId => quizAnswers[questionId] != null).length;
    };

    const getTotalQuestionsCount = () => {
        // Try multiple sources for total questions count
        if (currentQuiz?.totalQuestions > 0) {
            return currentQuiz.totalQuestions;
        }
        if (currentQuiz?.questions && Array.isArray(currentQuiz.questions)) {
            return currentQuiz.questions.length;
        }
        if (quizAttempt?.attemptAnswers && Array.isArray(quizAttempt.attemptAnswers)) {
            return quizAttempt.attemptAnswers.length;
        }
        if (quizAttempt?.totalQuestions > 0) {
            return quizAttempt.totalQuestions;
        }
        return 0;
    };

    const renderLessonContent = () => {
        if (!currentLesson?.content) {
            return <Text style={{ color: '#666', fontStyle: 'italic' }}>Chưa có nội dung bài học</Text>;
        }

        const isHtml = /<[a-z][\s\S]*>/i.test(currentLesson.content);
        
        if (isHtml) {
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    style={{ 
                        lineHeight: '1.8',
                        fontSize: '16px',
                        color: '#333'
                    }}
                />
            );
        } else {
            return (
                <Paragraph style={{ 
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#333',
                    whiteSpace: 'pre-wrap'
                }}>
                    {currentLesson.content}
                </Paragraph>
            );
        }
    };

    const calculateProgress = () => {
        // Use real enrollment progress if available
        if (enrollment && enrollment.progress !== undefined) {
            return Math.round(enrollment.progress * 100);
        }
        
        // Fallback to lesson-based calculation
        if (lessons.length === 0) return 0;
        return Math.round(((currentLessonIndex + 1) / lessons.length) * 100);
    };

    const isLessonCompleted = (lesson) => {
        if (!progressData || progressData.length === 0) return false;
        
        const lessonId = lesson.lesson?.id || lesson.id;
        const progressItem = progressData.find(p => p.lessonId === lessonId);
        return progressItem ? progressItem.isCompleted : false;
    };

    const isQuizCompleted = (lessonId) => {
        // Check if lesson has a quiz and if the student has passed it
        const quiz = getQuizForLesson(lessonId);
        if (!quiz) return false;
        
        // If we have bestScore data and it's passed, the quiz is completed
        if (bestScore && bestScore.isPassed) {
            return true;
        }
        
        return false;
    };

    useEffect(() => {
        if (courseId) {
            // Clear all quiz-related state when switching courses
            setBestScore(null);
            setQuizHistory([]);
            setQuizCompletionStatus({});
            setCurrentQuiz(null);
            setQuizAttempt(null);
            setQuizResult(null);
            setQuizAnswers({});
            
            fetchCourseDetails();
        }
    }, [courseId]);

    // Timer effect for quiz
    useEffect(() => {
        let interval = null;
        if (timerActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Time's up! Auto submit quiz
                        setTimerActive(false);
                        handleSubmitQuiz();
                        message.warning('Hết thời gian! Quiz đã được tự động nộp bài.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!timerActive) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeRemaining]);

    // Prevent navigation when quiz is active
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (quizVisible && !quizResult) {
                e.preventDefault();
                e.returnValue = 'Bạn đang làm quiz. Nếu rời khỏi trang, bài làm sẽ bị mất!';
                return 'Bạn đang làm quiz. Nếu rời khỏi trang, bài làm sẽ bị mất!';
            }
        };

        if (quizVisible && !quizResult) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [quizVisible, quizResult]);

    const handleBack = () => {
        navigate('/student/my-courses');
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    const lessonsSidebar = (
        <div style={{ height: '100%', overflow: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                    Danh sách bài học
                </Title>
                <Text type="secondary">
                    {lessons.length} bài học
                </Text>
            </div>
            
            <List
                dataSource={lessons}
                renderItem={(lesson, index) => {
                    const isCompleted = isLessonCompleted(lesson);
                    const lessonId = lesson.lesson?.id || lesson.id;
                    const hasQuiz = getQuizForLesson(lessonId) !== null;
                    const isQuizPassed = quizCompletionStatus[lessonId] || false;
                    
                    // Consider lesson completed if normal completion OR quiz passed
                    const isFullyCompleted = isCompleted || isQuizPassed;
                    
                    // Debug: Log quiz detection for first lesson
                    if (index === 0 && hasQuiz) {
                        console.log('Quiz detected for first lesson:', getQuizForLesson(lessonId).title);
                    }
                    
                    return (
                        <List.Item
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                backgroundColor: index === currentLessonIndex ? '#e6f7ff' : 'transparent',
                                borderLeft: index === currentLessonIndex ? '4px solid #1890ff' : '4px solid transparent'
                            }}
                            onClick={() => handleLessonSelect(lesson, index)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar 
                                        size="small"
                                        style={{ 
                                            backgroundColor: isFullyCompleted ? '#52c41a' : '#d9d9d9',
                                            color: 'white'
                                        }}
                                    >
                                        {isFullyCompleted ? <CheckCircleOutlined /> : (index + 1)}
                                    </Avatar>
                                }
                                title={
                                    <div>
                                        <Text 
                                            strong={index === currentLessonIndex}
                                            style={{ 
                                                color: index === currentLessonIndex ? '#1890ff' : '#333',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {lesson.lesson?.title || lesson.title || `Bài học ${index + 1}`}
                                        </Text>
                                                                {hasQuiz && (
                            <QuestionCircleOutlined 
                                style={{ 
                                    marginLeft: '8px',
                                    color: '#1890ff',
                                    fontSize: '12px'
                                }} 
                                title="Bài học có quiz"
                            />
                        )}
                                    </div>
                                }
                                description={
                                    <div>
                                        <Text 
                                            style={{ 
                                                fontSize: '12px',
                                                color: '#666',
                                                display: 'block'
                                            }}
                                        >
                                            {lesson.lesson?.description || lesson.description || 'Không có mô tả'}
                                        </Text>
                                        <div style={{ marginTop: '4px' }}>
                                            {isFullyCompleted && (
                                                <Tag color="green" size="small">
                                                    Đã hoàn thành
                                                </Tag>
                                            )}
                                            {hasQuiz && (
                                                <Tag color={isQuizPassed ? "green" : "blue"} size="small">
                                                    <QuestionCircleOutlined style={{ marginRight: '2px' }} />
                                                    Quiz {isQuizPassed && '✓'}
                                                </Tag>
                                            )}
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    );
                }}
            />
        </div>
    );

    return (
        <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <Affix offsetTop={0}>
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '16px 24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space>
                                <Button 
                                    icon={<ArrowLeftOutlined />} 
                                    onClick={handleBack}
                                >
                                    Quay lại khóa học
                                </Button>
                                <Button 
                                    icon={<MenuOutlined />} 
                                    onClick={() => setSidebarVisible(true)}
                                >
                                    Danh sách bài học
                                </Button>
                            </Space>
                        </Col>
                        <Col flex="auto" style={{ textAlign: 'center' }}>
                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                {course?.title}
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Text>Tiến độ:</Text>
                                <Progress 
                                    percent={calculateProgress()} 
                                    size="small" 
                                    style={{ width: '100px' }}
                                />
                            </Space>
                        </Col>
                    </Row>
                </div>
            </Affix>

            <Row style={{ height: 'calc(100vh - 80px)' }}>
                {/* Main content */}
                <Col xs={24} lg={24} style={{ height: '100%', overflow: 'auto' }}>
                    <div style={{ padding: '24px' }}>
                        {lessonLoading ? (
                            <div style={{ textAlign: 'center', padding: '100px' }}>
                                <Spin size="large" />
                            </div>
                        ) : currentLesson ? (
                            <Row gutter={[24, 24]}>
                                {/* Lesson content */}
                                <Col xs={24} xl={16}>
                                    <Card
                                        style={{
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            minHeight: '600px'
                                        }}
                                        bodyStyle={{ padding: '32px' }}
                                    >
                                        {/* Lesson header */}
                                        <div style={{ marginBottom: '24px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <Title level={2} style={{ 
                                    color: '#1890ff',
                                    margin: 0,
                                    flex: 1
                                }}>
                                    {currentLesson.title}
                                </Title>
                                <Space>
                                    {currentLesson.quiz && (
                                        <Button
                                            type="primary"
                                            icon={<QuestionCircleOutlined />}
                                            onClick={handleStartQuiz}
                                        >
                                            Làm Quiz
                                        </Button>
                                    )}
                                    <Tag color="blue">
                                        Bài {currentLessonIndex + 1}/{lessons.length}
                                    </Tag>
                                </Space>
                            </div>

                                            {currentLesson.description && (
                                                <div style={{ 
                                                    marginBottom: '16px',
                                                    padding: '12px',
                                                    backgroundColor: '#f6ffed',
                                                    border: '1px solid #b7eb8f',
                                                    borderRadius: '6px'
                                                }}>
                                                    <Text style={{ 
                                                        fontSize: '14px',
                                                        color: '#52c41a',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        {currentLesson.description}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>

                                        <Divider />

                                        {/* Video */}
                                        {currentLesson.videoUrl && (
                                            <div style={{ marginBottom: '24px' }}>
                                                <video
                                                    controls
                                                    style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                                                    src={getDisplayImageUrl(currentLesson.videoUrl)}
                                                />
                                            </div>
                                        )}

                                        {/* Image */}
                                        {currentLesson.imageUrl && (
                                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                                <Image
                                                    src={getDisplayImageUrl(currentLesson.imageUrl)}
                                                    alt={currentLesson.title}
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '400px',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div style={{ marginBottom: '32px' }}>
                                            <Title level={4} style={{ color: '#1890ff', marginBottom: '16px' }}>
                                                Nội dung bài học
                                            </Title>
                                            <Card style={{ backgroundColor: '#fafafa' }}>
                                                {renderLessonContent()}
                                            </Card>
                                        </div>



                                        {/* Navigation */}
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            marginTop: '32px',
                                            paddingTop: '24px',
                                            borderTop: '1px solid #f0f0f0'
                                        }}>
                                            <Button 
                                                onClick={handlePrevLesson}
                                                disabled={currentLessonIndex === 0}
                                                icon={<LeftOutlined />}
                                            >
                                                Bài trước
                                            </Button>
                                            <Button 
                                                type="primary"
                                                onClick={handleNextLesson}
                                                disabled={currentLessonIndex === lessons.length - 1}
                                            >
                                                Bài tiếp theo
                                                <RightOutlined />
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>

                                {/* Documents */}
                                <Col xs={24} xl={8}>
                                    <Row gutter={[0, 24]}>
                                        {/* Quiz Info Card */}
                                        {currentLesson?.quiz && (
                                            <Col xs={24}>
                                                <Card
                                                    title={
                                                        <Space>
                                                            <QuestionCircleOutlined style={{ color: bestScore?.isPassed ? '#52c41a' : '#1890ff' }} />
                                                            <span>Quiz bài học</span>
                                                            {bestScore?.isPassed && (
                                                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                                            )}
                                                        </Space>
                                                    }
                                                    style={{
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                                        borderLeft: `4px solid ${bestScore?.isPassed ? '#52c41a' : '#1890ff'}`,
                                                        backgroundColor: bestScore?.isPassed ? '#f6ffed' : undefined
                                                    }}
                                                    bodyStyle={{ padding: '16px' }}
                                                    extra={
                                                        bestScore?.isPassed ? (
                                                            <Tag color="success" size="small">
                                                                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                                                                ĐÃ HOÀN THÀNH
                                                            </Tag>
                                                        ) : (
                                                            <Button 
                                                                type="link" 
                                                                size="small"
                                                                onClick={handleStartQuiz}
                                                                loading={quizLoading}
                                                            >
                                                                Làm ngay
                                                            </Button>
                                                        )
                                                    }
                                                >
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <Text strong style={{ color: bestScore?.isPassed ? '#52c41a' : '#1890ff' }}>
                                                            {currentLesson.quiz.title}
                                                        </Text>
                                                        
                                                        {/* Best Score Display */}
                                                        {bestScore?.isPassed && (
                                                            <div style={{ 
                                                                padding: '8px 12px',
                                                                backgroundColor: 'rgba(82, 196, 26, 0.1)',
                                                                borderRadius: '6px',
                                                                border: '1px solid #b7eb8f',
                                                                marginBottom: '8px'
                                                            }}>
                                                                <Space>
                                                                    <TrophyOutlined style={{ color: '#52c41a' }} />
                                                                    <Text strong style={{ color: '#52c41a' }}>
                                                                        Điểm cao nhất: {bestScore.score?.toFixed(1)} ({bestScore.percentage?.toFixed(1)}%)
                                                                    </Text>
                                                                </Space>
                                                            </div>
                                                        )}
                                                        
                                                        <div>
                                                            <Space wrap size="small">
                                                                <Tag color="blue" size="small">
                                                                    {currentLesson.quiz.totalQuestions || currentLesson.quiz.questions?.length || 0} câu
                                                                </Tag>
                                                                {currentLesson.quiz.timeLimitMinutes && (
                                                                    <Tag color="orange" size="small">
                                                                        {currentLesson.quiz.timeLimitMinutes}p
                                                                    </Tag>
                                                                )}
                                                                {currentLesson.quiz.passingScore && (
                                                                    <Tag color="green" size="small">
                                                                        Đạt: {currentLesson.quiz.passingScore}%
                                                                    </Tag>
                                                                )}
                                                            </Space>
                                                        </div>

                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            {bestScore?.isPassed ? (
                                                                // Buttons for completed quiz
                                                                <>
                                                                    <Button
                                                                        type="default"
                                                                        block
                                                                        icon={<EyeOutlined />}
                                                                        onClick={handleViewHistory}
                                                                        style={{ 
                                                                            backgroundColor: '#f6ffed',
                                                                            borderColor: '#52c41a',
                                                                            color: '#52c41a'
                                                                        }}
                                                                    >
                                                                        Xem kết quả chi tiết
                                                                    </Button>
                                                                    <Button
                                                                        type="primary"
                                                                        block
                                                                        icon={<QuestionCircleOutlined />}
                                                                        onClick={handleStartQuiz}
                                                                        loading={quizLoading}
                                                                        style={{ marginTop: '8px' }}
                                                                    >
                                                                        {quizLoading ? 'Đang tải...' : 'Làm lại Quiz'}
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                // Button for new quiz
                                                                <>
                                                                    <Button
                                                                        type="primary"
                                                                        block
                                                                        icon={<QuestionCircleOutlined />}
                                                                        onClick={handleStartQuiz}
                                                                        loading={quizLoading}
                                                                    >
                                                                        {quizLoading ? 'Đang tải...' : 'Bắt đầu Quiz'}
                                                                    </Button>
                                                                    <Button
                                                                        block
                                                                        icon={<HistoryOutlined />}
                                                                        onClick={handleViewHistory}
                                                                        style={{ marginTop: '4px' }}
                                                                    >
                                                                        Xem lịch sử
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </Space>
                                                    </Space>
                                                </Card>
                                            </Col>
                                        )}

                                        {/* Lesson documents */}
                                        {lessonDocuments.length > 0 && (
                                            <Col xs={24}>
                                                <Card
                                                    title="Tài liệu bài học"
                                                    style={{
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                                    }}
                                                    bodyStyle={{ padding: '16px' }}
                                                >
                                                    <List
                                                        size="small"
                                                        dataSource={lessonDocuments}
                                                        renderItem={(doc) => (
                                                            <List.Item
                                                                style={{
                                                                    padding: '8px',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: '#fafafa',
                                                                    marginBottom: '8px',
                                                                    borderRadius: '6px'
                                                                }}
                                                                onClick={() => handleDocumentPreview(doc, true)}
                                                                actions={[
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<EyeOutlined />}
                                                                        title="Xem trước"
                                                                    />,
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<DownloadOutlined />}
                                                                        title="Tải xuống"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDocumentDownload(doc, true);
                                                                        }}
                                                                    />
                                                                ]}
                                                            >
                                                                <List.Item.Meta
                                                                    avatar={getFileIcon(doc.fileName)}
                                                                    title={<Text style={{ fontSize: '12px' }}>{doc.title || 'Tài liệu'}</Text>}
                                                                    description={<Text style={{ fontSize: '10px' }}>{truncateFileName(doc.fileName)}</Text>}
                                                                />
                                                            </List.Item>
                                                        )}
                                                    />
                                                </Card>
                                            </Col>
                                        )}

                                        {/* Course documents */}
                                        {courseDocuments.length > 0 && (
                                            <Col xs={24}>
                                                <Card
                                                    title="Tài liệu khóa học"
                                                    style={{
                                                        borderRadius: '12px',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                                    }}
                                                    bodyStyle={{ padding: '16px' }}
                                                >
                                                    <List
                                                        size="small"
                                                        dataSource={courseDocuments}
                                                        renderItem={(doc) => (
                                                            <List.Item
                                                                style={{
                                                                    padding: '8px',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: '#fafafa',
                                                                    marginBottom: '8px',
                                                                    borderRadius: '6px'
                                                                }}
                                                                onClick={() => handleDocumentPreview(doc, false)}
                                                                actions={[
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<EyeOutlined />}
                                                                        title="Xem trước"
                                                                    />,
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<DownloadOutlined />}
                                                                        title="Tải xuống"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDocumentDownload(doc, false);
                                                                        }}
                                                                    />
                                                                ]}
                                                            >
                                                                <List.Item.Meta
                                                                    avatar={getFileIcon(doc.fileName)}
                                                                    title={<Text style={{ fontSize: '12px' }}>{doc.title || 'Tài liệu'}</Text>}
                                                                    description={<Text style={{ fontSize: '10px' }}>{truncateFileName(doc.fileName)}</Text>}
                                                                />
                                                            </List.Item>
                                                        )}
                                                    />
                                                </Card>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                            </Row>
                        ) : (
                            <Empty 
                                description="Khóa học chưa có bài học nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </div>
                </Col>
            </Row>

            {/* Mobile drawer for lessons */}
            <Drawer
                title="Danh sách bài học"
                placement="left"
                onClose={() => setSidebarVisible(false)}
                visible={sidebarVisible}
                width={320}
                bodyStyle={{ padding: 0 }}
            >
                {lessonsSidebar}
            </Drawer>

            {/* Document Preview Modal */}
            <Modal
                title={`Xem trước: ${previewDocument?.title || previewDocument?.originalFileName || 'Tài liệu'}`}
                open={documentPreviewVisible}
                onCancel={handleCloseDocumentPreview}
                footer={[
                    <Button key="download" icon={<DownloadOutlined />} onClick={() => {
                        if (previewDocument) {
                            handleDocumentDownload(previewDocument, lessonDocuments.includes(previewDocument));
                        }
                    }}>
                        Tải xuống
                    </Button>,
                    <Button key="close" onClick={handleCloseDocumentPreview}>
                        Đóng
                    </Button>
                ]}
                width="80%"
                style={{ top: 20 }}
                bodyStyle={{ height: '75vh', padding: 0 }}
            >
                {previewDocument && previewUrl && (
                    (() => {
                        const fileName = previewDocument.originalFileName || previewDocument.fileName || '';
                        const fileExtension = fileName.toLowerCase().split('.').pop();
                        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
                        
                        if (imageTypes.includes(fileExtension)) {
                            // Hiển thị image trực tiếp
                            return (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', backgroundColor: '#f5f5f5' }}>
                                    <img
                                        src={previewUrl}
                                        alt={previewDocument.title || previewDocument.originalFileName}
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '100%', 
                                            objectFit: 'contain',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                </div>
                            );
                        } else {
                            // Hiển thị PDF hoặc text files trong iframe
                            const fileName = previewDocument.originalFileName || previewDocument.fileName || '';
                            const fileExtension = fileName.toLowerCase().split('.').pop();
                            
                            if (fileExtension === 'pdf') {
                                // Sử dụng object tag cho PDF để tránh auto-download
                                return (
                                    <object
                                        data={previewUrl}
                                        type="application/pdf"
                                        style={{ width: '100%', height: '100%' }}
                                        aria-label={previewDocument.title || previewDocument.originalFileName}
                                    >
                                        <iframe
                                            src={previewUrl}
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                            title={previewDocument.title || previewDocument.originalFileName}
                                        />
                                    </object>
                                );
                            } else {
                                // Text files vẫn dùng iframe
                                return (
                                    <iframe
                                        src={previewUrl}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title={previewDocument.title || previewDocument.originalFileName}
                                    />
                                );
                            }
                        }
                    })()
                )}
                {previewDocument && !previewUrl && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px' }}>Đang tải tài liệu...</div>
                    </div>
                )}
            </Modal>

            {/* Quiz Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            <QuestionCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Quiz: {currentQuiz?.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {timeRemaining !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ClockCircleOutlined style={{ 
                                        color: timeRemaining < 300 ? '#ff4d4f' : '#fa8c16' // Red if < 5 min, orange otherwise
                                    }} />
                                    <Text style={{ 
                                        color: timeRemaining < 300 ? '#ff4d4f' : '#fa8c16',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                    }}>
                                        {formatTime(timeRemaining)}
                                    </Text>
                                </div>
                            )}
                            <Button 
                                type="text" 
                                icon={<CloseOutlined />} 
                                onClick={handleCloseQuiz}
                                size="small"
                                disabled={!quizResult && timerActive}
                                title={!quizResult && timerActive ? 'Không thể đóng quiz khi đang làm bài' : 'Đóng quiz'}
                            />
                        </div>
                    </div>
                }
                open={quizVisible}
                onCancel={quizResult ? handleCloseQuiz : undefined}
                footer={null}
                width={1000}
                destroyOnClose
                closable={false}
                maskClosable={!!quizResult}
            >
                {quizLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px' }}>Đang tải quiz...</div>
                    </div>
                ) : quizResult ? (
                    // Quiz Result View
                    <div>
                        <Alert
                            message={
                                <div style={{ textAlign: 'center' }}>
                                    <Title level={3} style={{ margin: '8px 0', color: quizResult.isPassed ? '#52c41a' : '#ff4d4f' }}>
                                        {quizResult.isPassed ? (
                                            <>
                                                <CheckCircleOutlined style={{ marginRight: '8px' }} />
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
                            type={quizResult.isPassed ? 'success' : 'error'}
                            showIcon={false}
                            style={{ marginBottom: '24px' }}
                        />

                        <Row gutter={16} style={{ marginBottom: '24px' }}>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Điểm số"
                                        value={quizResult.score}
                                        precision={1}
                                        valueStyle={{ color: '#1890ff' }}
                                        suffix={`/ ${quizResult.totalPossibleScore}`}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Phần trăm"
                                        value={quizResult.percentage}
                                        precision={1}
                                        valueStyle={{ 
                                            color: quizResult.percentage >= quizResult.passingScore ? '#52c41a' : '#ff4d4f' 
                                        }}
                                        suffix="%"
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Câu đúng"
                                        value={quizResult.correctAnswers}
                                        valueStyle={{ color: '#52c41a' }}
                                        suffix={`/ ${quizResult.totalQuestions}`}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card>
                                    <Statistic
                                        title="Điểm đạt"
                                        value={quizResult.passingScore}
                                        valueStyle={{ color: '#fa8c16' }}
                                        suffix="%"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Button type="primary" size="large" onClick={handleCloseQuiz}>
                                Đóng Quiz
                            </Button>
                        </div>
                    </div>
                ) : currentQuiz && (
                    // Quiz Taking View
                    <div>
                        {/* Timer Warning */}
                        {timeRemaining !== null && timeRemaining < 300 && timeRemaining > 0 && (
                            <Alert
                                message={`Còn lại ${formatTime(timeRemaining)} để hoàn thành quiz!`}
                                type="warning"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                        )}

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <Text strong>Tiến độ làm bài</Text>
                                <Text>{getAnsweredQuestionsCount()} / {getTotalQuestionsCount()} câu đã trả lời</Text>
                            </div>
                            <Progress 
                                percent={Math.round((getAnsweredQuestionsCount() / getTotalQuestionsCount()) * 100)}
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
                                    <Text strong>Câu hỏi {currentQuestionIndex + 1} / {getTotalQuestionsCount()}</Text>
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
                                        disabled={currentQuestionIndex === getTotalQuestionsCount() - 1}
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
                                    <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
                                        {getCurrentQuestion().questionText}
                                    </Text>
                                    <div style={{ marginTop: '8px' }}>
                                        <Tag color="blue">Điểm: {getCurrentQuestion().points}</Tag>
                                    </div>
                                </div>

                                <Radio.Group
                                    value={quizAnswers[getCurrentQuestion().id]}
                                    onChange={(e) => handleAnswerQuestion(getCurrentQuestion().id, e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {getCurrentQuestion().answers
                                            ?.sort((a, b) => a.orderIndex - b.orderIndex)
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
                                                    <div style={{ marginLeft: '8px', lineHeight: '1.5' }}>
                                                        {answer.answerText}
                                                    </div>
                                                </Radio>
                                            ))
                                        }
                                    </Space>
                                </Radio.Group>
                            </Card>
                        ) : (
                            <Card title={`Câu ${currentQuestionIndex + 1}`} style={{ marginBottom: '24px' }}>
                                <Alert
                                    message="Không thể tải câu hỏi"
                                    description="Quiz chưa có câu hỏi hoặc có lỗi xảy ra."
                                    type="warning"
                                    showIcon
                                />
                            </Card>
                        )}

                        {/* Question Overview */}
                        <Card title="Tổng quan câu hỏi" size="small" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {currentQuiz.questions?.map((question, index) => {
                                    const isAnswered = quizAnswers[question.id];
                                    const isCurrent = index === currentQuestionIndex;
                                    return (
                                        <Button
                                            key={question.id}
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
                                }) || []}
                            </div>
                        </Card>

                        {/* Submit Button */}
                        <div style={{ textAlign: 'center' }}>
                            <Space size="large">
                                <Button 
                                    size="large" 
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Xác nhận hủy quiz',
                                            content: 'Bạn có chắc chắn muốn hủy quiz? Tất cả dữ liệu đã làm sẽ được lưu lại.',
                                            okText: 'Hủy quiz',
                                            cancelText: 'Tiếp tục làm',
                                            onOk: handleCloseQuiz,
                                        });
                                    }}
                                >
                                    Hủy Quiz
                                </Button>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    onClick={handleSubmitQuiz}
                                    disabled={getAnsweredQuestionsCount() === 0}
                                >
                                    Nộp bài ({getAnsweredQuestionsCount()} / {getTotalQuestionsCount()})
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Quiz History Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HistoryOutlined style={{ color: '#1890ff' }} />
                        <span>Lịch sử làm quiz</span>
                        {currentLesson?.quiz && (
                            <Tag color="blue">{currentLesson.quiz.title}</Tag>
                        )}
                    </div>
                }
                open={historyVisible}
                onCancel={handleCloseHistory}
                footer={[
                    <Button 
                        key="retake" 
                        type="primary"
                        icon={<QuestionCircleOutlined />}
                        onClick={() => {
                            handleCloseHistory();
                            handleStartQuiz();
                        }}
                        loading={quizLoading}
                    >
                        Làm lại Quiz
                    </Button>,
                    <Button key="close" onClick={handleCloseHistory}>
                        Đóng
                    </Button>
                ]}
                width={900}
                style={{ top: 20 }}
            >
                {historyLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px' }}>Đang tải lịch sử...</div>
                    </div>
                ) : (
                    <div>
                        {/* Best Score Summary */}
                        {bestScore && (
                            <Card 
                                style={{ 
                                    marginBottom: '24px',
                                    backgroundColor: '#f6ffed',
                                    border: '1px solid #b7eb8f'
                                }}
                            >
                                <Row gutter={16} align="middle">
                                    <Col>
                                        <TrophyOutlined 
                                            style={{ 
                                                fontSize: '24px', 
                                                color: '#52c41a' 
                                            }} 
                                        />
                                    </Col>
                                    <Col flex="auto">
                                        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                                            Điểm số cao nhất
                                        </Text>
                                        <div>
                                            <Space>
                                                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                                    {bestScore.score?.toFixed(1) || '0'} điểm
                                                </Text>
                                                <Text style={{ fontSize: '18px', color: '#52c41a' }}>
                                                    ({bestScore.percentage?.toFixed(1) || '0'}%)
                                                </Text>
                                                <Tag color={bestScore.isPassed ? 'green' : 'orange'}>
                                                    {bestScore.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                </Tag>
                                            </Space>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Lần {bestScore.attemptNumber} • {dayjs(bestScore.completedAt).format('DD/MM/YYYY HH:mm')}
                                        </Text>
                                    </Col>
                                </Row>
                            </Card>
                        )}

                        {/* History Table */}
                        {quizHistory.length > 0 ? (
                            <div>
                                <Title level={5} style={{ marginBottom: '16px' }}>
                                    Lịch sử các lần làm bài ({quizHistory.length} lần)
                                </Title>
                                <List
                                    dataSource={quizHistory}
                                    renderItem={(attempt, index) => (
                                        <List.Item
                                            style={{
                                                padding: '16px',
                                                border: '1px solid #f0f0f0',
                                                borderRadius: '8px',
                                                marginBottom: '12px',
                                                backgroundColor: attempt.isPassed ? '#f6ffed' : '#fff2e8'
                                            }}
                                        >
                                            <Row style={{ width: '100%' }} gutter={16}>
                                                <Col xs={24} sm={6}>
                                                    <div>
                                                        <Text strong>Lần {attempt.attemptNumber}</Text>
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {dayjs(attempt.completedAt).format('DD/MM/YYYY')}
                                                            </Text>
                                                        </div>
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {dayjs(attempt.completedAt).format('HH:mm')}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={6}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: attempt.isPassed ? '#52c41a' : '#fa8c16' }}>
                                                            {attempt.score?.toFixed(1) || '0'}
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>điểm</Text>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={4}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: attempt.isPassed ? '#52c41a' : '#fa8c16' }}>
                                                            {attempt.percentage?.toFixed(1) || '0'}%
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>tỷ lệ</Text>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={4}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Tag color={attempt.isPassed ? 'green' : 'orange'}>
                                                            {attempt.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                        </Tag>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={4}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                            {attempt.durationMinutes || 0}
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>phút</Text>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </List.Item>
                                    )}
                                />

                                {/* Statistics */}
                                {quizHistory.length > 1 && (
                                    <Card 
                                        title="Thống kê"
                                        size="small"
                                        style={{ marginTop: '24px' }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Tổng số lần làm"
                                                    value={quizHistory.length}
                                                    valueStyle={{ color: '#1890ff' }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Số lần đạt"
                                                    value={quizHistory.filter(a => a.isPassed).length}
                                                    valueStyle={{ color: '#52c41a' }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Điểm trung bình"
                                                    value={quizHistory.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizHistory.length}
                                                    precision={1}
                                                    suffix="%"
                                                    valueStyle={{ color: '#fa8c16' }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Tiến bộ"
                                                    value={
                                                        quizHistory.length > 1 
                                                            ? (quizHistory[0].percentage || 0) - (quizHistory[quizHistory.length - 1].percentage || 0)
                                                            : 0
                                                    }
                                                    precision={1}
                                                    suffix="%"
                                                    valueStyle={{ 
                                                        color: quizHistory.length > 1 && 
                                                               (quizHistory[0].percentage || 0) - (quizHistory[quizHistory.length - 1].percentage || 0) > 0 
                                                               ? '#52c41a' : '#ff4d4f' 
                                                    }}
                                                    prefix={
                                                        quizHistory.length > 1 && 
                                                        (quizHistory[0].percentage || 0) - (quizHistory[quizHistory.length - 1].percentage || 0) > 0 
                                                        ? '+' : ''
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <Empty 
                                description="Chưa có lịch sử làm quiz"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentLearning; 
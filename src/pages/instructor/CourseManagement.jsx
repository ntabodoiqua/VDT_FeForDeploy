/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Image,
  Switch,
  Tooltip,
  Descriptions,
  Tag,
  Upload,
  DatePicker,
  Row,
  Col,
  Card,
  List,
  Divider,
  Drawer,
  Progress,
  Rate,
  Statistic,
  Spin,
  Collapse,
  Dropdown,
  Menu,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  ClearOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UserOutlined,
  BarChartOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import LargeFileUpload from "../../components/Upload/LargeFileUpload";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { AuthContext } from "../../components/context/auth.context";
import {
  fetchCoursesApi,
  fetchCourseByIdApi,
  createCourseApi,
  updateCourseApi,
  deleteCourseApi,
  toggleCourseStatusApi,
  fetchCategoriesApi,
  fetchCourseDocumentsApi,
  uploadCourseDocumentApi,
  deleteCourseDocumentApi,
  downloadCourseDocumentApi,
  getCourseQuizStatisticsApi,
  getCourseStudentQuizResultsApi,
  getStudentQuizHistoryInCourseApi,
  getQuizAttemptsOverTimeApi,
} from "../../util/api";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const CourseManagement = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addEditForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [thumbnailFileList, setThumbnailFileList] = useState([]);

  // Course Documents state
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [courseDocuments, setCourseDocuments] = useState([]);
  const [selectedCourseForDocs, setSelectedCourseForDocs] = useState(null);
  const [uploadDocumentModalVisible, setUploadDocumentModalVisible] =
    useState(false);
  const [documentForm] = Form.useForm();
  const [documentFileList, setDocumentFileList] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filterValues, setFilterValues] = useState({
    title: null,
    category: null,
    isActive: null,
    createdDateRange: null,
    startDateRange: null,
  });

  // Quiz Statistics state
  const [quizStatisticsVisible, setQuizStatisticsVisible] = useState(false);
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentQuizStats, setStudentQuizStats] = useState(null);
  const [loadingQuizStats, setLoadingQuizStats] = useState(false);
  const [loadingStudentStats, setLoadingStudentStats] = useState(false);
  const [studentHistoryVisible, setStudentHistoryVisible] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);

  // New states for general stats
  const [generalStats, setGeneralStats] = useState(null);
  const [loadingGeneralStats, setLoadingGeneralStats] = useState(false);
  const [selectedQuizForLineChart, setSelectedQuizForLineChart] = useState(null);
  const [lineChartData, setLineChartData] = useState([]);
  const [loadingLineChart, setLoadingLineChart] = useState(false);

  const getDisplayImageUrl = (urlPath) => {
    if (!urlPath) return null;

    if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
      return urlPath;
    }

    if (urlPath.startsWith("/")) {
      const API_IMAGE_BASE_URL = "http://localhost:8080/lms";
      return `${API_IMAGE_BASE_URL}${encodeURI(urlPath)}`;
    }

    console.warn(
      `getDisplayImageUrl: Encountered an image path in an unexpected format: ${urlPath}`
    );
    return urlPath;
  };

  const getCategoryName = (course) => {
    // Nếu có category object với name
    if (course.category && course.category.name) {
      return course.category.name;
    }
    // Nếu có categoryId
    if (course.categoryId) {
      const foundCategory = categories.find(
        (cat) => cat.id === course.categoryId
      );
      return foundCategory ? foundCategory.name : "N/A";
    }
    // Nếu có categoryName
    if (course.categoryName) {
      return course.categoryName;
    }
    return "N/A";
  };

  const columns = [
    {
      title: "Tên khóa học",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
      align: "center",
    },
    {
      title: "Ảnh đại diện",
      dataIndex: "thumbnailUrl",
      key: "thumbnail",
      width: 80,
      align: "center",
      render: (thumbnailUrl) => {
        const fullUrl = getDisplayImageUrl(thumbnailUrl);
        return fullUrl ? (
          <Image width={40} src={fullUrl} alt="Thumbnail" />
        ) : (
          "N/A"
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 250,
      ellipsis: true,
      align: "center",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 120,
      align: "center",
      render: (category, record) => getCategoryName(record),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusToggle(record, checked)}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      align: "center",
      render: (_, record) => {
        const moreMenuItems = [
          {
            key: 'student-view',
            icon: <UserOutlined />,
            label: 'Xem giao diện học viên',
            onClick: () => navigate(`/instructor/student-course-view/${record.id}`),
          },
          {
            key: 'docs',
            icon: <FileTextOutlined />,
            label: 'Quản lý tài liệu',
            onClick: () => handleViewDocuments(record),
          },
          {
            key: 'quiz-stats',
            icon: <BarChartOutlined />,
            label: 'Thống kê Quiz',
            onClick: () => handleViewQuizStatistics(record),
          },
        ];
        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items: moreMenuItems }} trigger={["click"]}>
              <Tooltip title="Thao tác khác">
                <Button icon={<MoreOutlined />} />
              </Tooltip>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const fetchCourses = async (
    page = 1,
    pageSize = pagination.pageSize,
    filtersToApply = filterValues
  ) => {
    if (!auth.username) return;

    setLoading(true);
    const params = {
      page: page - 1,
      size: pageSize,
      title: filtersToApply.title || undefined,
      instructorName: auth.username,
      category: filtersToApply.category || undefined,
      isActive:
        filtersToApply.isActive === null || filtersToApply.isActive === "all"
          ? undefined
          : filtersToApply.isActive,
      createdFrom: filtersToApply.createdDateRange?.[0]
        ? filtersToApply.createdDateRange[0].startOf("day").toISOString()
        : undefined,
      createdTo: filtersToApply.createdDateRange?.[1]
        ? filtersToApply.createdDateRange[1].endOf("day").toISOString()
        : undefined,
      startDateFrom: filtersToApply.startDateRange?.[0]
        ? filtersToApply.startDateRange[0].format("YYYY-MM-DD")
        : undefined,
      startDateTo: filtersToApply.startDateRange?.[1]
        ? filtersToApply.startDateRange[1].format("YYYY-MM-DD")
        : undefined,
    };

    Object.keys(params).forEach(
      (key) =>
        (params[key] === undefined || params[key] === "") && delete params[key]
    );
    console.log("Fetching courses with params:", params);

    try {
      const response = await fetchCoursesApi(params);
      const data = response;
      if (data.code === 1000 && data.result) {
        setCourses(data.result.content);
        setPagination({
          current: data.result.pageable.pageNumber + 1,
          pageSize: data.result.pageable.pageSize,
          total: data.result.totalElements,
        });
      } else {
        message.error(data.message || "Không thể tải danh sách khóa học");
      }
    } catch (error) {
      message.error("Không thể tải danh sách khóa học: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const response = await fetchCategoriesApi({ page: 0, size: 1000 });
      const data = response;
      if (data.code === 1000 && data.result) {
        setCategories(data.result.content);
      } else {
        message.error(data.message || "Không thể tải danh sách danh mục");
      }
    } catch (error) {
      message.error("Không thể tải danh sách danh mục: " + error.message);
    }
  };

  useEffect(() => {
    if (auth.username) {
      fetchCourses(pagination.current, pagination.pageSize, filterValues);
    }
    fetchCategoriesList();
  }, [auth.username]);

  const handleViewDetails = async (course) => {
    console.log("View details for course:", course);
    setLoading(true);

    try {
      const response = await fetchCourseByIdApi(course.id);
      console.log("View details raw response (axios):", response);
      const data = response;
      console.log("View details response data (axios):", data);
      if (data.code === 1000 && data.result) {
        setSelectedCourseDetails(data.result);
        setViewModalVisible(true);
      } else {
        message.error(data.message || "Không thể tải chi tiết khóa học");
      }
    } catch (error) {
      console.error("View details error object:", error);
      message.error("Không thể tải chi tiết khóa học: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (course, newActiveStatus) => {
    console.log(
      "Toggling status for course:",
      course,
      "to new status:",
      newActiveStatus
    );

    try {
      const payload = { isActive: newActiveStatus };

      const response = await toggleCourseStatusApi(course.id, payload);
      console.log("Toggle status API Response (axios):", response);
      const apiResponseData = response;

      if (apiResponseData.code === 1000 && apiResponseData.result) {
        const actualStatusFromApi = apiResponseData.result.isActive;

        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c.id === course.id ? { ...c, isActive: actualStatusFromApi } : c
          )
        );
        message.success(
          apiResponseData.message ||
            `Khóa học "${course.title}" ${
              actualStatusFromApi ? "đã được mở" : "đã được đóng"
            }.`
        );
      } else {
        message.error(
          apiResponseData.message || "Không thể cập nhật trạng thái khóa học."
        );
      }
    } catch (error) {
      console.error(
        "Toggle status error:",
        error,
        "for course:",
        course,
        "newStatus:",
        newActiveStatus
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật trạng thái khóa học";
      message.error(errorMessage);
    }
  };

  const handleTableChange = (newPageInfo) => {
    const { current, pageSize } = newPageInfo;
    const newPage = pagination.pageSize !== pageSize ? 1 : current;
    fetchCourses(newPage, pageSize, filterValues);
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleEdit = (course) => {
    setEditingCourse(course);

    const formData = {
      ...course,
      instructor: course.instructor ? course.instructor.username : undefined,
      isActive: course.isActive,
      startDate: course.startDate ? dayjs(course.startDate) : null,
      endDate: course.endDate ? dayjs(course.endDate) : null,
      categoryName:
        getCategoryName(course) !== "N/A" ? getCategoryName(course) : undefined,
      detailedDescription: course.detailedDescription || undefined,
      requiresApproval: course.requiresApproval,
    };
    addEditForm.setFieldsValue(formData);

    if (course.thumbnailUrl) {
      setThumbnailFileList([
        {
          uid: "-1",
          name: "thumbnail.png",
          status: "done",
          url: getDisplayImageUrl(course.thumbnailUrl),
          thumbUrl: getDisplayImageUrl(course.thumbnailUrl),
        },
      ]);
    } else {
      setThumbnailFileList([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (course) => {
    console.log("Attempting to delete course:", course);

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);

        try {
          const response = await deleteCourseApi(course.id);
          console.log("Delete course raw response (axios):", response);

          const data = response;
          console.log("Delete course response data (axios):", data);
          if (data.code === 1000) {
            message.success(data.message || "Xóa khóa học thành công");
            fetchCourses(pagination.current, pagination.pageSize, filterValues);
          } else {
            message.error(
              data.message || "Không thể xóa khóa học. Lỗi từ API."
            );
          }
        } catch (error) {
          console.error(
            "Delete course error object:",
            error,
            "for course:",
            course
          );
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Không thể xóa khóa học";
          message.error(errorMessage);
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        console.log("Hủy xóa khóa học");
      },
    });
  };

  // Course Documents functions
  const handleViewDocuments = async (course) => {
    setSelectedCourseForDocs(course);
    setDocumentsModalVisible(true);
    await fetchCourseDocuments(course.id);
  };

  const fetchCourseDocuments = async (courseId) => {
    setLoadingDocuments(true);
    try {
      const response = await fetchCourseDocumentsApi(courseId);
      if (response && response.result) {
        setCourseDocuments(response.result);
      } else {
        message.error("Không thể tải danh sách tài liệu");
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách tài liệu: " + error.message);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleUploadDocument = () => {
    setUploadDocumentModalVisible(true);
  };

  const handleDocumentSubmit = async (values) => {
    if (!documentFileList.length) {
      message.error("Vui lòng chọn file");
      return;
    }

    const formData = new FormData();
    formData.append(
      "request",
      new Blob(
        [
          JSON.stringify({
            title: values.title,
            description: values.description,
          }),
        ],
        { type: "application/json" }
      )
    );
    formData.append("file", documentFileList[0]);

    setUploading(true);
    setShowProgress(true);
    setUploadProgress(0);

    try {
      const response = await uploadCourseDocumentApi(
        selectedCourseForDocs.id,
        formData,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      );

      if (response && response.result) {
        message.success("Tài liệu đã được tải lên thành công");
        setUploadDocumentModalVisible(false);
        resetUploadState();
        await fetchCourseDocuments(selectedCourseForDocs.id);
      } else {
        message.error("Không thể tải lên tài liệu");
      }
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "Lỗi khi tải lên tài liệu";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Tải lên bị timeout. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.";
      } else if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Lỗi server: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadState = () => {
    documentForm.resetFields();
    setDocumentFileList([]);
    setUploadProgress(0);
    setShowProgress(false);
    setUploading(false);
  };

  const handleFileSelect = (file) => {
    setDocumentFileList([file]);
  };

  const handleDeleteDocument = async (documentId) => {
    Modal.confirm({
      title: "Bạn có chắc chắn muốn xóa tài liệu này?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteCourseDocumentApi(selectedCourseForDocs.id, documentId);
          message.success("Tài liệu đã được xóa thành công");
          await fetchCourseDocuments(selectedCourseForDocs.id);
        } catch (error) {
          message.error("Lỗi khi xóa tài liệu: " + error.message);
        }
      },
    });
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await downloadCourseDocumentApi(
        selectedCourseForDocs.id,
        documentId
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Lỗi khi tải xuống tài liệu: " + error.message);
    }
  };

  // Quiz Statistics Functions
  const handleViewQuizStatistics = async (course) => {
    setSelectedCourseForQuiz(course);
    setQuizStatisticsVisible(true);

    // Reset all stats
    setStudentList([]);
    setSelectedStudentId(null);
    setStudentQuizStats(null);
    setGeneralStats(null);
    setLineChartData([]);
    setSelectedQuizForLineChart(null);

    // Fetch student list for dropdown
    setLoadingQuizStats(true);
    try {
      const response = await getCourseStudentQuizResultsApi(course.id, {
        page: 0,
        size: 1000,
      });
      if (response && response.code === 1000) {
        const results = response.result.content || [];
        const uniqueStudents = results.reduce((acc, current) => {
          if (!acc.find((item) => item.studentId === current.studentId)) {
            acc.push({
              studentId: current.studentId,
              studentUsername: current.studentUsername,
              studentFirstName: current.studentFirstName,
              studentLastName: current.studentLastName,
            });
          }
          return acc;
        }, []);
        setStudentList(uniqueStudents);
      } else {
        message.error("Không thể tải danh sách học viên.");
      }
    } catch (error) {
      console.error("Error fetching student list for quiz stats:", error);
      message.error("Lỗi khi tải danh sách học viên.");
    } finally {
      setLoadingQuizStats(false);
    }

    // Fetch general course stats
    setLoadingGeneralStats(true);
    try {
      const response = await getCourseQuizStatisticsApi(course.id);
      if (response && response.code === 1000) {
        setGeneralStats(response.result);
      } else {
        message.error("Không thể tải thống kê chung của khóa học.");
      }
    } catch (error) {
      console.error("Error fetching general course stats:", error);
      message.error("Lỗi khi tải thống kê chung của khóa học.");
    } finally {
      setLoadingGeneralStats(false);
    }
  };

  const handleLineChartQuizSelect = async (quizId) => {
    setSelectedQuizForLineChart(quizId);
    if (!quizId) {
      setLineChartData([]);
      return;
    }

    setLoadingLineChart(true);
    try {
      const response = await getQuizAttemptsOverTimeApi(quizId);
      if (response && response.code === 1000) {
        setLineChartData(response.result || []);
      } else {
        message.error("Không thể tải dữ liệu biểu đồ.");
      }
    } catch (error) {
      console.error("Error fetching line chart data:", error);
      message.error("Lỗi khi tải dữ liệu biểu đồ.");
    } finally {
      setLoadingLineChart(false);
    }
  };

  const handleStudentSelectForStats = async (studentId) => {
    setSelectedStudentId(studentId);

    if (!studentId) {
      setStudentQuizStats(null);
      return;
    }

    setLoadingStudentStats(true);
    setStudentQuizStats(null);

    try {
      const historyResponse = await getStudentQuizHistoryInCourseApi(
        selectedCourseForQuiz.id,
        studentId
      );

      if (historyResponse && historyResponse.code === 1000) {
        const history = historyResponse.result || [];

        if (history.length === 0) {
          setStudentQuizStats({
            totalAttempts: 0,
            quizzesTaken: 0,
            passRate: 0,
            bestAttempts: [],
          });
          return;
        }

        // Calculate stats
        const totalAttempts = history.length;

        // Group by quizId
        const groupedByQuiz = history.reduce((acc, attempt) => {
          (acc[attempt.quizId] = acc[attempt.quizId] || []).push(attempt);
          return acc;
        }, {});

        const quizzesTaken = Object.keys(groupedByQuiz).length;

        // Find best attempt for each quiz
        const bestAttempts = Object.values(groupedByQuiz).map((attempts) => {
          return attempts.reduce((best, current) =>
            current.score > best.score ? current : best
          );
        });

        // Calculate pass rate based on best attempts
        const passedQuizzesCount = bestAttempts.filter((a) => a.isPassed).length;
        const passRate =
          quizzesTaken > 0 ? (passedQuizzesCount / quizzesTaken) * 100 : 0;

        setStudentQuizStats({
          totalAttempts,
          quizzesTaken,
          passRate,
          bestAttempts,
        });
      } else {
        message.error("Không thể tải lịch sử làm quiz của học viên.");
      }
    } catch (error) {
      console.error("Error fetching student quiz history for stats:", error);
      message.error("Lỗi khi tải lịch sử làm quiz của học viên.");
    } finally {
      setLoadingStudentStats(false);
    }
  };

  const handleViewStudentHistory = async (student) => {
    const studentInfo = studentList.find(s => s.studentId === selectedStudentId);
    setSelectedStudentInfo(studentInfo);
    setStudentHistoryVisible(true);
    setLoadingStudentHistory(true);

    try {
      const response = await getStudentQuizHistoryInCourseApi(
        selectedCourseForQuiz.id,
        selectedStudentId
      );
      if (response && response.code === 1000) {
        setSelectedStudentHistory(response.result || []);
      } else {
        message.error("Không thể tải lịch sử quiz của học viên.");
      }
    } catch (error) {
      console.error("Error fetching student quiz history:", error);
      message.error("Lỗi khi tải lịch sử quiz.");
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    console.log("Form submitted with values:", values);

    try {
      const formData = new FormData();

      if (values.thumbnailFile && values.thumbnailFile.length > 0) {
        if (values.thumbnailFile[0].originFileObj) {
          formData.append("thumbnail", values.thumbnailFile[0].originFileObj);
        }
      }

      const courseData = {
        title: values.title,
        description: values.description,
        detailedDescription: values.detailedDescription,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        categoryName: values.categoryName,
      };

      if (values.hasOwnProperty("isActive")) {
        courseData.isActive = values.isActive;
      }
      if (values.hasOwnProperty("requiresApproval")) {
        courseData.requiresApproval = values.requiresApproval;
      }

      formData.append("course", JSON.stringify(courseData));

      let apiCallResponse;
      if (editingCourse) {
        apiCallResponse = await updateCourseApi(editingCourse.id, formData);
        console.log("Update course response (axios):", apiCallResponse);
      } else {
        const creationPayload = {
          title: values.title,
          description: values.description,
          detailedDescription: values.detailedDescription,
          startDate: values.startDate
            ? values.startDate.format("YYYY-MM-DD")
            : null,
          endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
          categoryName: values.categoryName,
          isActive: values.isActive === undefined ? false : values.isActive,
          requiresApproval:
            values.requiresApproval === undefined
              ? false
              : values.requiresApproval,
        };

        formData.set("course", JSON.stringify(creationPayload));

        console.log(
          "Attempting to create course (POST request) with formData parts:"
        );
        for (let pair of formData.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }
        apiCallResponse = await createCourseApi(formData);
        console.log("Create course response (axios):", apiCallResponse);
      }

      const data = apiCallResponse;
      if (data.code === 1000) {
        message.success(
          data.message ||
            (editingCourse
              ? "Cập nhật khóa học thành công"
              : "Tạo khóa học thành công")
        );
        setModalVisible(false);
        addEditForm.resetFields();
        setEditingCourse(null);
        setThumbnailFileList([]);
        fetchCourses(
          editingCourse ? pagination.current : 1,
          pagination.pageSize,
          filterValues
        );
      } else {
        message.error(data.message || "Có lỗi xảy ra khi lưu khóa học.");
      }
    } catch (error) {
      console.error(
        "Submit course error:",
        error,
        "Values:",
        values,
        "Editing course:",
        editingCourse
      );
      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onApplyFilters = () => {
    const currentFilterFormValues = filterForm.getFieldsValue();
    setFilterValues(currentFilterFormValues);
    fetchCourses(1, pagination.pageSize, currentFilterFormValues);
  };

  const onClearFilters = () => {
    filterForm.resetFields();
    const clearedFilters = {
      title: null,
      category: null,
      isActive: null,
      createdDateRange: null,
      startDateRange: null,
    };
    setFilterValues(clearedFilters);
    fetchCourses(1, pagination.pageSize, clearedFilters);
  };

  const renderFilterArea = () => (
    <Card style={{ marginBottom: 16 }}>
      <Form form={filterForm} layout="vertical" onFinish={onApplyFilters}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="title" label="Tên khóa học">
              <Input placeholder="Nhập tên khóa học" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="category" label="Danh mục">
              <Select placeholder="Chọn danh mục" allowClear>
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.name}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="isActive" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value="all">Tất cả</Option>
                <Option value={true}>Đang mở</Option>
                <Option value={false}>Đã đóng</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={12}>
            <Form.Item name="createdDateRange" label="Ngày tạo">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={12}>
            <Form.Item name="startDateRange" label="Ngày bắt đầu (khóa học)">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
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
            setEditingCourse(null);
            addEditForm.resetFields();
            setThumbnailFileList([]);
            setModalVisible(true);
          }}
        >
          Thêm khóa học
        </Button>
      </div>

      {renderFilterArea()}

      <Table
        columns={columns}
        dataSource={courses}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "15", "20"],
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingCourse ? "Sửa khóa học" : "Thêm khóa học"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          addEditForm.resetFields();
          setEditingCourse(null);
          setThumbnailFileList([]);
        }}
        footer={null}
        width={800}
      >
        <Form form={addEditForm} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Tên khóa học"
            rules={[{ required: true, message: "Vui lòng nhập tên khóa học" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item name="detailedDescription" label="Mô tả chi tiết">
            <TextArea rows={5} />
          </Form.Item>

          <Form.Item
            name="categoryName"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map((category) => (
                <Option key={category.id} value={category.name}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="thumbnailFile"
            label="Ảnh đại diện"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              name="thumbnail"
              listType="picture"
              maxCount={1}
              fileList={thumbnailFileList}
              beforeUpload={(file) => {
                setThumbnailFileList([file]);
                return false;
              }}
              onRemove={() => {
                setThumbnailFileList([]);
              }}
              onChange={({ fileList: newFileList }) => {
                setThumbnailFileList(newFileList);
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="startDate" label="Ngày bắt đầu">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="endDate" label="Ngày kết thúc">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái khóa học"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select>
              <Option value={true}>Đang mở</Option>
              <Option value={false}>Đã đóng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="requiresApproval"
            label="Yêu cầu duyệt"
            valuePropName="checked"
          >
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCourse ? "Cập nhật" : "Thêm mới"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  addEditForm.resetFields();
                  setEditingCourse(null);
                  setThumbnailFileList([]);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {selectedCourseDetails && (
        <Modal
          title="Chi tiết khóa học"
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false);
            setSelectedCourseDetails(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setViewModalVisible(false);
                setSelectedCourseDetails(null);
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <Descriptions bordered column={1} layout="horizontal">
            <Descriptions.Item label="ID">
              {selectedCourseDetails.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên khóa học">
              {selectedCourseDetails.title}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedCourseDetails.description}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả chi tiết">
              {selectedCourseDetails.detailedDescription}
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục">
              {getCategoryName(selectedCourseDetails)}
            </Descriptions.Item>
            <Descriptions.Item label="Ảnh đại diện">
              {selectedCourseDetails.thumbnailUrl ? (
                <Image
                  width={100}
                  src={getDisplayImageUrl(selectedCourseDetails.thumbnailUrl)}
                  alt={selectedCourseDetails.title}
                />
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số bài học">
              {selectedCourseDetails.totalLessons}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {selectedCourseDetails.startDate
                ? new Date(selectedCourseDetails.startDate).toLocaleDateString(
                    "vi-VN"
                  )
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">
              {selectedCourseDetails.endDate
                ? new Date(selectedCourseDetails.endDate).toLocaleDateString(
                    "vi-VN"
                  )
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedCourseDetails.createdAt
                ? new Date(selectedCourseDetails.createdAt).toLocaleString(
                    "vi-VN"
                  )
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật gần nhất">
              {selectedCourseDetails.updatedAt
                ? new Date(selectedCourseDetails.updatedAt).toLocaleString(
                    "vi-VN"
                  )
                : "N/A"}
            </Descriptions.Item>
            {selectedCourseDetails.instructor && (
              <Descriptions.Item label="Giảng viên">
                {`${selectedCourseDetails.instructor.firstName} ${selectedCourseDetails.instructor.lastName} (${selectedCourseDetails.instructor.username})`}
                {selectedCourseDetails.instructor.avatarUrl && (
                  <Image
                    width={50}
                    src={getDisplayImageUrl(
                      selectedCourseDetails.instructor.avatarUrl
                    )}
                    alt="avatar"
                    style={{ marginLeft: 10, borderRadius: "50%" }}
                  />
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Yêu cầu duyệt">
              {selectedCourseDetails.requiresApproval ? (
                <Tag color="warning">Có</Tag>
              ) : (
                <Tag color="default">Không</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedCourseDetails.isActive ? (
                <Tag color="success">Đang mở</Tag>
              ) : (
                <Tag color="error">Đã đóng</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      )}

      {/* Course Documents Modal */}
      <Modal
        title={`Quản lý tài liệu - ${selectedCourseForDocs?.title || ""}`}
        open={documentsModalVisible}
        onCancel={() => {
          setDocumentsModalVisible(false);
          setSelectedCourseForDocs(null);
          setCourseDocuments([]);
        }}
        footer={[
          <Button key="upload" type="primary" onClick={handleUploadDocument}>
            <UploadOutlined /> Tải lên tài liệu
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setDocumentsModalVisible(false);
              setSelectedCourseForDocs(null);
              setCourseDocuments([]);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        <List
          loading={loadingDocuments}
          dataSource={courseDocuments}
          locale={{ emptyText: "Chưa có tài liệu nào" }}
          renderItem={(document) => (
            <List.Item
              actions={[
                <Tooltip title="Tải xuống">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      handleDownloadDocument(
                        document.id,
                        document.originalFileName
                      )
                    }
                  />
                </Tooltip>,
                <Tooltip title="Xóa">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteDocument(document.id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <FileTextOutlined
                    style={{ fontSize: 24, color: "#1890ff" }}
                  />
                }
                title={document.title}
                description={
                  <div>
                    <div>{document.description}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginTop: "4px",
                      }}
                    >
                      File: {document.originalFileName} | Kích thước:{" "}
                      {(document.fileSize / 1024).toFixed(2)} KB | Tải lên:{" "}
                      {new Date(document.uploadedAt).toLocaleDateString(
                        "vi-VN"
                      )}{" "}
                      | Bởi: {document.uploadedByUsername}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        title="Tải lên tài liệu"
        open={uploadDocumentModalVisible}
        onCancel={() => {
          if (!uploading) {
            setUploadDocumentModalVisible(false);
            resetUploadState();
          }
        }}
        footer={null}
        width={700}
        closable={!uploading}
        maskClosable={!uploading}
      >
        <Form
          form={documentForm}
          layout="vertical"
          onFinish={handleDocumentSubmit}
        >
          <Form.Item
            name="title"
            label="Tiêu đề tài liệu"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề tài liệu" },
            ]}
          >
            <Input disabled={uploading} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} disabled={uploading} />
          </Form.Item>

          <Form.Item
            label="File tài liệu"
            rules={[{ required: true, message: "Vui lòng chọn file" }]}
          >
            <LargeFileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv"
              maxSizeMB={5}
              uploading={uploading}
              uploadProgress={uploadProgress}
              showProgress={showProgress}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                disabled={!documentFileList.length || uploading}
              >
                {uploading ? "Đang tải lên..." : "Tải lên"}
              </Button>
              <Button
                onClick={() => {
                  if (!uploading) {
                    setUploadDocumentModalVisible(false);
                    resetUploadState();
                  }
                }}
                disabled={uploading}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Quiz Statistics Drawer */}
      <Drawer
        title={`Thống kê Quiz - ${selectedCourseForQuiz?.title || ""}`}
        width={1200}
        open={quizStatisticsVisible}
        onClose={() => {
          setQuizStatisticsVisible(false);
          setSelectedCourseForQuiz(null);
          setStudentList([]);
          setSelectedStudentId(null);
          setStudentQuizStats(null);
          setGeneralStats(null);
          setLineChartData([]);
          setSelectedQuizForLineChart(null);
        }}
      >
        <Collapse defaultActiveKey={["1", "2"]}>
          <Panel header="Thống kê chung của khóa học" key="1">
            {loadingGeneralStats ? (
              <Spin />
            ) : generalStats && generalStats.quizPerformance ? (
              <>
                <Card
                  title="Tỷ lệ Đạt/Chưa đạt theo từng Quiz"
                  style={{ marginBottom: 24 }}
                >
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={generalStats.quizPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quizTitle" angle={-45} textAnchor="end" height={100} interval={0} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="passedCount" name="Đã đạt" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="failedCount" name="Chưa đạt" stackId="a" fill="#ff4d4f" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Số lượt làm bài theo thời gian">
                  <Select
                    placeholder="Chọn một quiz để xem"
                    style={{ width: 300, marginBottom: 16 }}
                    onChange={handleLineChartQuizSelect}
                    allowClear
                    value={selectedQuizForLineChart}
                  >
                    {generalStats.quizPerformance.map((quiz) => (
                      <Option key={quiz.quizId} value={quiz.quizId}>
                        {quiz.quizTitle}
                      </Option>
                    ))}
                  </Select>
                  {loadingLineChart ? (
                    <Spin />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="attemptCount"
                          name="Số lượt làm bài"
                          stroke="#8884d8"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </>
            ) : (
              <p>Không có dữ liệu thống kê.</p>
            )}
          </Panel>
          <Panel header="Thống kê chi tiết theo học viên" key="2">
            <div style={{ marginBottom: 24 }}>
              <Select
                showSearch
                placeholder="Chọn một học viên để xem thống kê"
                style={{ width: 400 }}
                value={selectedStudentId}
                onChange={handleStudentSelectForStats}
                loading={loadingQuizStats}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={studentList.map((s) => ({
                  value: s.studentId,
                  label: `${s.studentFirstName} ${s.studentLastName} (@${s.studentUsername})`,
                }))}
                allowClear
              />
            </div>

            {(loadingQuizStats || loadingStudentStats) && <Spin />}

            {!selectedStudentId && !loadingStudentStats && (
              <p>Vui lòng chọn một học viên để xem thống kê chi tiết.</p>
            )}

            {selectedStudentId && studentQuizStats && !loadingStudentStats && (
              <div>
                {/* Statistics Overview for the selected student */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Tổng số Quiz đã làm"
                        value={studentQuizStats.quizzesTaken}
                        prefix={<QuestionCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Tổng lượt làm bài"
                        value={studentQuizStats.totalAttempts}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="Tỷ lệ Quiz đạt"
                        value={studentQuizStats.passRate}
                        precision={1}
                        suffix="%"
                        prefix={<TrophyOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Student Results Table (Best attempts) */}
                <Card title="Kết quả học viên (Điểm cao nhất ở mỗi Quiz)">
                  <Table
                    dataSource={studentQuizStats.bestAttempts}
                    rowKey="quizId"
                    columns={[
                      {
                        title: "Quiz",
                        dataIndex: "quizTitle",
                        key: "quizTitle",
                      },
                      {
                        title: "Điểm",
                        dataIndex: "score",
                        key: "score",
                        align: "center",
                        sorter: (a, b) => a.score - b.score,
                        render: (score, record) => {
                          const maxScore =
                            record.maxScore > 0 ? record.maxScore : 10;
                          return (
                            <span
                              style={{
                                color:
                                  score >= maxScore * 0.7
                                    ? "#52c41a"
                                    : score >= maxScore * 0.5
                                    ? "#faad14"
                                    : "#ff4d4f",
                                fontWeight: "bold",
                              }}
                            >
                              {score?.toFixed(1)}/{maxScore?.toFixed(1)}
                            </span>
                          );
                        },
                      },
                      {
                        title: "Phần trăm",
                        dataIndex: "percentage",
                        key: "percentage",
                        align: "center",
                        sorter: (a, b) => a.percentage - b.percentage,
                        render: (percentage) => (
                          <Progress
                            percent={Math.round(percentage)}
                            size="small"
                            status={percentage >= 50 ? "success" : "exception"}
                          />
                        ),
                      },
                      {
                        title: "Ngày hoàn thành",
                        dataIndex: "completedAt",
                        key: "completedAt",
                        align: "center",
                        sorter: (a, b) =>
                          new Date(a.completedAt) - new Date(b.completedAt),
                        render: (date) =>
                          date ? new Date(date).toLocaleString("vi-VN") : "N/A",
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "isPassed",
                        key: "isPassed",
                        align: "center",
                        render: (isPassed) =>
                          isPassed ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              Đạt
                            </Tag>
                          ) : (
                            <Tag color="error" icon={<CloseCircleOutlined />}>
                              Chưa đạt
                            </Tag>
                          ),
                      },
                      {
                        title: "Lịch sử SV",
                        key: "action",
                        align: "center",
                        render: (_, record) => (
                          <Tooltip title="Xem toàn bộ lịch sử làm quiz của học viên này trong khóa học">
                            <Button
                              type="primary"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewStudentHistory(record)}
                            >
                              Xem
                            </Button>
                          </Tooltip>
                        ),
                      },
                    ]}
                    pagination={{
                      pageSize: 5,
                      showTotal: (total) => `Tổng ${total} kết quả`,
                    }}
                  />
                </Card>
              </div>
            )}
          </Panel>
        </Collapse>
      </Drawer>

      {/* Student Quiz History Modal */}
      <Modal
        title={`Lịch sử làm Quiz - ${selectedStudentInfo?.studentFirstName} ${selectedStudentInfo?.studentLastName}`}
        open={studentHistoryVisible}
        onCancel={() => {
          setStudentHistoryVisible(false);
          setSelectedStudentHistory([]);
          setSelectedStudentInfo(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setStudentHistoryVisible(false);
              setSelectedStudentHistory([]);
              setSelectedStudentInfo(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={1000}
      >
        <Table
          dataSource={selectedStudentHistory}
          rowKey="attemptId"
          loading={loadingStudentHistory}
          columns={[
            {
              title: "Quiz",
              dataIndex: "quizTitle",
              key: "quizTitle",
            },
            {
              title: "Lần thử",
              dataIndex: "attemptNumber",
              key: "attemptNumber",
              align: "center",
              sorter: (a, b) => a.attemptNumber - b.attemptNumber,
            },
            {
              title: "Điểm số",
              dataIndex: "score",
              key: "score",
              align: "center",
              sorter: (a, b) => a.score - b.score,
              render: (score, record) => {
                const maxScore = record.maxScore > 0 ? record.maxScore : 10;
                return (
                  <span
                    style={{
                      color:
                        score >= maxScore * 0.7
                          ? "#52c41a"
                          : score >= maxScore * 0.5
                          ? "#faad14"
                          : "#ff4d4f",
                      fontWeight: "bold",
                    }}
                  >
                    {score?.toFixed(1)}/{maxScore?.toFixed(1)}
                  </span>
                );
              },
            },
            {
              title: "Phần trăm",
              dataIndex: "percentage",
              key: "percentage",
              align: "center",
              render: (percentage) => (
                <Progress
                  percent={Math.round(percentage)}
                  size="small"
                  status={percentage >= 50 ? "success" : "exception"}
                />
              ),
            },
            {
              title: "Kết quả",
              dataIndex: "isPassed",
              key: "isPassed",
              align: "center",
              render: (isPassed) =>
                isPassed ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Đạt
                  </Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Chưa đạt
                  </Tag>
                ),
            },
            {
              title: "Thời gian bắt đầu",
              dataIndex: "startedAt",
              key: "startedAt",
              align: "center",
              render: (date) => new Date(date).toLocaleString("vi-VN"),
            },
            {
              title: "Thời gian hoàn thành",
              dataIndex: "completedAt",
              key: "completedAt",
              align: "center",
              render: (date) =>
                date ? new Date(date).toLocaleString("vi-VN") : "N/A",
            },
            {
              title: "Thời gian làm bài",
              dataIndex: "duration",
              key: "duration",
              align: "center",
              render: (duration, record) => {
                // Tính thời gian làm bài từ startedAt và completedAt
                if (record.startedAt && record.completedAt) {
                  const startTime = new Date(record.startedAt);
                  const endTime = new Date(record.completedAt);
                  const durationMs = endTime - startTime;
                  const durationMinutes = Math.ceil(durationMs / (1000 * 60));
                  return `${durationMinutes} phút`;
                }
                return duration ? `${duration} phút` : "N/A";
              },
            },
          ]}
          pagination={{
            pageSize: 5,
            showTotal: (total) => `Tổng ${total} lần làm bài`,
          }}
        />
      </Modal>
    </div>
  );
};

export default CourseManagement;

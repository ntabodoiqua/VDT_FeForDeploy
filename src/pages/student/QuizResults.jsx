import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Spin,
  Alert,
  List,
  Card,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Empty,
  Progress,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  fetchCourseByIdApi,
  fetchCourseQuizzesApi,
  getBestQuizScoreApi,
} from "../../util/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const QuizResults = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      setLoading(true);
      setError(null);
      try {
        const courseRes = await fetchCourseByIdApi(courseId);
        if (courseRes.code === 1000 && courseRes.result) {
          setCourse(courseRes.result);
        } else {
          throw new Error("Không thể tải thông tin khóa học.");
        }

        const quizzesRes = await fetchCourseQuizzesApi(courseId);
        if (quizzesRes.code === 1000 && quizzesRes.result) {
          const quizList = quizzesRes.result;
          setQuizzes(quizList);

          if (quizList.length > 0) {
            const resultsPromises = quizList.map((quiz) =>
              getBestQuizScoreApi(quiz.id, courseId).catch(() => null)
            );
            const resultsData = await Promise.all(resultsPromises);
            const resultsMap = {};
            resultsData.forEach((res, index) => {
              if (res?.code === 1000 && res.result) {
                resultsMap[quizList[index].id] = res.result;
              } else {
                resultsMap[quizList[index].id] = null;
              }
            });
            setResults(resultsMap);
          }
        } else {
          setQuizzes([]);
        }
      } catch (e) {
        setError(e.message || "Đã có lỗi xảy ra.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleBack = () => {
    navigate(`/student/learning/${courseId}`);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "50px" }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
        <Button onClick={handleBack} style={{ marginTop: "20px" }}>
          Quay lại
        </Button>
      </div>
    );
  }

  const totalQuizzes = quizzes.length;
  const passedQuizzes = Object.values(results).filter(
    (r) => r && r.isPassed
  ).length;
  const overallProgress =
    totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0;

  return (
    <div style={{ padding: "24px 48px", backgroundColor: "#f0f2f5" }}>
      <Card
        style={{ maxWidth: "1000px", margin: "0 auto", borderRadius: "8px" }}
      >
        <Row align="middle" justify="space-between" style={{ marginBottom: "24px" }}>
          <Col>
            <Space align="center">
              <TrophyOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Kết quả học tập - {course?.title}
                </Title>
                <Text type="secondary">
                  Tổng quan kết quả các bài quiz trong khóa học.
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Quay lại trang học
            </Button>
          </Col>
        </Row>


        <Card style={{ marginBottom: "24px" }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Tổng số bài Quiz" value={totalQuizzes} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Số Quiz đã vượt qua"
                value={passedQuizzes}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col span={8}>
              <Text>Tỉ lệ hoàn thành</Text>
              <Progress
                percent={overallProgress}
                strokeColor={{
                  from: "#108ee9",
                  to: "#87d068",
                }}
              />
            </Col>
          </Row>
        </Card>
        
        <Title level={4} style={{ marginBottom: '20px' }}>Chi tiết kết quả</Title>

        {quizzes.length > 0 ? (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 2,
              xxl: 2,
            }}
            dataSource={quizzes}
            renderItem={(quiz) => {
              const result = results[quiz.id];
              const isPassed = result?.isPassed;
              const totalPoints =
                quiz.totalPoints ??
                (result?.percentage > 0
                  ? Math.round((result.score * 100) / result.percentage)
                  : undefined);

              return (
                <List.Item>
                  <Card
                    hoverable
                    title={quiz.title}
                    style={{
                      borderLeft: `5px solid ${
                        isPassed ? "#52c41a" : result ? "#ff4d4f" : "#d9d9d9"
                      }`,
                      borderRadius: "8px"
                    }}
                    extra={
                        result ? (
                          isPassed ? (
                            <Tag icon={<CheckCircleOutlined />} color="success">
                              Đã qua
                            </Tag>
                          ) : (
                            <Tag icon={<CloseCircleOutlined />} color="error">
                              Chưa đạt
                            </Tag>
                          )
                        ) : (
                          <Tag color="default">Chưa làm</Tag>
                        )
                      }
                  >
                    {result ? (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Điểm cao nhất"
                            value={result.score}
                            precision={1}
                            suffix={
                              totalPoints !== undefined
                                ? ` / ${totalPoints}`
                                : ""
                            }
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Tỉ lệ"
                            value={result.percentage}
                            precision={1}
                            suffix="%"
                            valueStyle={{
                              color: isPassed ? "#52c41a" : "#ff4d4f",
                            }}
                          />
                        </Col>
                         <Col span={24} style={{marginTop: "16px"}}>
                            <Text type="secondary">Vào lúc: {dayjs(result.completedAt).format("DD/MM/YYYY HH:mm")}</Text>
                        </Col>
                      </Row>
                    ) : (
                      <div style={{textAlign: 'center', padding: '20px 0'}}>
                        <Paragraph type="secondary">
                          Bạn chưa thực hiện bài quiz này.
                        </Paragraph>
                        <Button type="primary" onClick={() => navigate(`/student/learning/${courseId}`)}>
                            Bắt đầu học
                        </Button>
                      </div>
                    )}
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="Khóa học này không có bài quiz nào." />
        )}
      </Card>
    </div>
  );
};

export default QuizResults; 
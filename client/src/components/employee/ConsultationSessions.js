import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { getApiUrl } from "../../config/api";
import ConsultationDetail from "./ConsultationDetail";

const Container = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 20px 0;
`;

const Title = styled.h3`
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SessionItem = styled.div`
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
    transform: translateY(-2px);
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SessionDate = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`;

const SessionDuration = styled.div`
  font-size: 12px;
  color: #95a5a6;
  background: #ecf0f1;
  padding: 4px 8px;
  border-radius: 4px;
`;

const SessionSummary = styled.div`
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.4;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
  font-size: 14px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-size: 14px;
`;

const ConsultationSessions = ({ customerId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (customerId) {
      fetchConsultationSessions();
    }
  }, [customerId]);

  const fetchConsultationSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        getApiUrl(`/api/consultation/customers/${customerId}/sessions`)
      );

      console.log("상담 세션 API 응답:", response.data);

      if (response.data.success) {
        // 백엔드 응답 구조: ApiResponse{success, data: {success, data: [...], count}}
        const innerData = response.data.data;
        if (innerData && innerData.success) {
          const sessionData = innerData.data || [];
          setSessions(sessionData);
          console.log("상담 세션 데이터:", sessionData);
        } else {
          console.log(
            "Supabase에서 데이터 조회 실패 또는 데이터 없음:",
            innerData
          );
          // 데이터가 없어도 빈 배열로 설정하여 "상담 내역이 없습니다" 메시지 표시
          setSessions([]);
        }
      } else {
        setError("상담 세션을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("상담 세션 조회 오류:", err);
      setError("상담 세션을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSession(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "날짜 정보 없음";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "시간 정보 없음";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}분`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}시간 ${mins}분`;
    }
  };

  if (loading) {
    return (
      <Container>
        <Title>상담 내역</Title>
        <LoadingState>상담 세션을 불러오는 중...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>상담 내역</Title>
        <EmptyState>{error}</EmptyState>
      </Container>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Container>
        <Title>상담 내역</Title>
        <EmptyState>상담 내역이 없습니다.</EmptyState>
      </Container>
    );
  }

  const displayedSessions = showAll ? sessions : sessions.slice(0, PAGE_SIZE);

  return (
    <>
      <Container>
        <Title>상담 내역 ({sessions.length}건)</Title>
        <SessionList>
          {displayedSessions.map((session, index) => (
            <SessionItem
              key={session.session_id || index}
              onClick={() => handleSessionClick(session)}
            >
              <SessionHeader>
                <SessionDate>
                  {formatDate(session.session_start_time)}
                </SessionDate>
                <SessionDuration>
                  {formatDuration(
                    session.session_start_time,
                    session.session_end_time
                  )}
                </SessionDuration>
              </SessionHeader>
              <SessionSummary>
                {session.summary || "상담 요약 정보가 없습니다."}
              </SessionSummary>
            </SessionItem>
          ))}
        </SessionList>
        {sessions.length > PAGE_SIZE && (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 132, 133, 0.08), rgba(0, 132, 133, 0.12))",
              border: "2px solid rgba(0, 132, 133, 0.4)",
              borderRadius: "8px",
              padding: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 132, 133, 0.15)",
              marginTop: "12px",
              position: "relative",
            }}
            onClick={() => setShowAll((v) => !v)}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#008485";
              e.target.style.background =
                "linear-gradient(135deg, rgba(0, 132, 133, 0.15), rgba(0, 132, 133, 0.2))";
              e.target.style.boxShadow = "0 4px 16px rgba(0, 132, 133, 0.25)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(0, 132, 133, 0.4)";
              e.target.style.background =
                "linear-gradient(135deg, rgba(0, 132, 133, 0.08), rgba(0, 132, 133, 0.12))";
              e.target.style.boxShadow = "0 2px 8px rgba(0, 132, 133, 0.15)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#2c3e50",
                    marginBottom: "4px",
                  }}
                >
                  {showAll ? "상담 내역 접기" : "더 많은 상담 내역 보기"}
                </div>
                <div style={{ fontSize: "14px", color: "#7f8c8d" }}>
                  {showAll
                    ? "목록을 축소합니다"
                    : `${sessions.length - PAGE_SIZE}개 더 보기`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#3498db",
                    fontSize: "14px",
                  }}
                >
                  {showAll ? "↑" : "↓"}
                </div>
                <div style={{ fontSize: "12px", color: "#95a5a6" }}>
                  {showAll
                    ? `전체 ${sessions.length}건`
                    : `${PAGE_SIZE}건 / 전체 ${sessions.length}건`}
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>

      <ConsultationDetail
        sessionId={selectedSession?.session_id}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </>
  );
};

export default ConsultationSessions;

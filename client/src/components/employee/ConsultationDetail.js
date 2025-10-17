import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { BASE_URL } from "../../config/api";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 0;
  border-radius: 15px;
  width: 95%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #008485 0%, #006666 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 15px 15px 0 0;
`;

const ModalTitle = styled.h3`
  color: white;
  font-size: 24px;
  margin: 0;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const SessionInfo = styled.div`
  display: flex;
  justify-content: space-around;
  background: #f8f9fa;
  padding: 20px 30px;
  border-bottom: 1px solid #e9ecef;
  font-size: 15px;
  color: #495057;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: #212529;
  font-weight: 600;
`;

const ConversationContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 30px;
  background: #fafbfc;
  max-height: 60vh;
`;

const ConversationItem = styled.div`
  display: flex;
  margin-bottom: 25px;
  align-items: flex-start;
  gap: 15px;
`;

const SpeakerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
  background: ${(props) => (props.isCustomer ? "#007bff" : "#28a745")};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const MessageContent = styled.div`
  flex: 1;
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid
    ${(props) => (props.isCustomer ? "#007bff" : "#28a745")};
  position: relative;
`;

const SpeakerName = styled.div`
  font-weight: 600;
  color: ${(props) => (props.isCustomer ? "#007bff" : "#28a745")};
  font-size: 14px;
  margin-bottom: 8px;
`;

const MessageText = styled.div`
  color: #333;
  line-height: 1.6;
  font-size: 15px;
`;

const MessageTime = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 8px;
  text-align: right;
`;

const LoadingState = styled.div`
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 40px;
  font-size: 16px;
`;

const ErrorState = styled.div`
  text-align: center;
  color: #dc3545;
  font-weight: 600;
  padding: 40px;
  font-size: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
`;

const ConsultationSummary = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 15px 15px;
`;

const SummaryTitle = styled.h4`
  color: #495057;
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
`;

const SummaryText = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

const ConsultationDetail = ({ sessionId, isOpen, onClose }) => {
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
    }
  }, [isOpen, sessionId]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${BASE_URL}/api/consultation/sessions/${sessionId}/details`
      );

      if (response.data.success) {
        const sessionData = response.data.data.data;
        if (sessionData && sessionData.length > 0) {
          setSessionDetails(sessionData[0]);
        } else {
          setError("상담 세션 정보를 찾을 수 없습니다.");
        }
      } else {
        setError("상담 세션을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("상담 세션 상세 조회 오류:", err);
      setError("상담 세션을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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

  // 상담 스크립트 데이터를 full_transcript에서 파싱
  const parseConversationScript = (fullTranscript) => {
    if (!fullTranscript) return [];

    const messages = [];
    let messageId = 1;

    // "고객:"과 "행원:"으로 구분된 텍스트를 파싱
    const parts = fullTranscript.split(/(고객:|행원:)/);

    for (let i = 1; i < parts.length; i += 2) {
      const speaker = parts[i];
      const message = parts[i + 1];

      if (speaker && message) {
        const trimmedMessage = message.trim();
        if (trimmedMessage && trimmedMessage !== "") {
          messages.push({
            id: messageId++,
            speaker: speaker === "고객:" ? "customer" : "employee",
            message: trimmedMessage,
            timestamp:
              sessionDetails?.session_start_time || new Date().toISOString(),
          });
        }
      }
    }

    // 만약 파싱된 메시지가 없으면 전체 텍스트를 하나의 메시지로 처리
    if (messages.length === 0 && fullTranscript.trim()) {
      messages.push({
        id: 1,
        speaker: "employee",
        message: fullTranscript.trim(),
        timestamp:
          sessionDetails?.session_start_time || new Date().toISOString(),
      });
    }

    return messages;
  };

  if (!isOpen) return null;

  const conversation = parseConversationScript(sessionDetails?.full_transcript);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>상담 상세 내역</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {loading && <LoadingState>상담 내용을 불러오는 중...</LoadingState>}

        {error && <ErrorState>{error}</ErrorState>}

        {sessionDetails && !loading && !error && (
          <>
            <SessionInfo>
              <InfoItem>
                <InfoLabel>상담일</InfoLabel>
                <InfoValue>
                  {formatDate(sessionDetails.session_start_time)}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>상담시간</InfoLabel>
                <InfoValue>
                  {formatDuration(
                    sessionDetails.session_start_time,
                    sessionDetails.session_end_time
                  )}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>상담 유형</InfoLabel>
                <InfoValue>오프라인 상담</InfoValue>
              </InfoItem>
            </SessionInfo>

            <ConversationContainer>
              {conversation.map((message) => (
                <ConversationItem key={message.id}>
                  <SpeakerAvatar isCustomer={message.speaker === "customer"}>
                    {message.speaker === "customer" ? "고" : "행"}
                  </SpeakerAvatar>
                  <MessageContent isCustomer={message.speaker === "customer"}>
                    <SpeakerName isCustomer={message.speaker === "customer"}>
                      {message.speaker === "customer" ? "고객" : "행원"}
                    </SpeakerName>
                    <MessageText>{message.message}</MessageText>
                    <MessageTime>{formatTime(message.timestamp)}</MessageTime>
                  </MessageContent>
                </ConversationItem>
              ))}
            </ConversationContainer>

            {sessionDetails.summary && (
              <ConsultationSummary>
                <SummaryTitle>상담 요약</SummaryTitle>
                <SummaryText>{sessionDetails.summary}</SummaryText>
              </ConsultationSummary>
            )}
          </>
        )}

        {!sessionDetails && !loading && !error && (
          <EmptyState>상담 내용이 없습니다.</EmptyState>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ConsultationDetail;

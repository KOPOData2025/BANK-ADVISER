import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import { supabase } from "../../config/supabase";
import axios from "axios";

const ChatContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  height: 100vh;
  background: var(--hana-white, #ffffff);
  color: var(--hana-text, #1f2937);
  display: ${(props) => (props.isVisible ? "flex" : "none")};
  flex-direction: column;
  z-index: 1000;
  box-shadow: -10px 0 28px rgba(0, 0, 0, 0.1);
  border-left: 2px solid var(--hana-primary, #00857a);
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: var(--hana-primary, #00857a);
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s, transform 0.1s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.22);
  }
`;

const ChatStatus = styled.div`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  background: rgba(0, 133, 122, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => {
    if (props.isProcessing) return "#ff9800";
    if (props.isRecording) return "#4caf50";
    return "#666";
  }};
  animation: ${(props) => (props.isRecording ? "pulse 1.5s infinite" : "none")};

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  opacity: 0.7;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

const MessageBubble = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 15px;
  max-width: 85%;
  align-self: ${(props) => (props.isEmployee ? "flex-end" : "flex-start")};
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  opacity: 0.8;
`;

const SpeakerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const SpeakerAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${(props) => (props.isEmployee ? "#00857a" : "#10b981")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #ffffff;
`;

const SpeakerName = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const MessageTime = styled.span`
  font-size: 10px;
  opacity: 0.6;
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;

  &.interim {
    opacity: 0.9;
    font-style: italic;
  }
`;

const ChatControls = styled.div`
  display: none; /* controls removed */
`;

const ControlButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.primary {
    background: rgba(76, 175, 80, 0.3);
    border-color: rgba(76, 175, 80, 0.5);

    &:hover {
      background: rgba(76, 175, 80, 0.5);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MemoSection = styled.div`
  padding: 16px 20px 20px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
`;

const MemoTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  height: 160px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    outline: none;
    border-color: #00857a;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 133, 122, 0.12);
  }
`;

// SaveButton removed

const RealtimeChat = React.forwardRef(
  (
    {
      isVisible,
      onClose,
      messages = [],
      currentInterimText = "",
      currentSpeaker = "speaker_employee",
      isRecording = false,
      isProcessing = false,
      onClearMessages,
      onStartRecording,
      onStopRecording,
      employee,
      customer,
      onTranscript,
      onError,
    },
    ref
  ) => {
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [internalMessages, setInternalMessages] = useState([]);
    const [internalInterimText, setInternalInterimText] = useState("");
    const [internalCurrentSpeaker, setInternalCurrentSpeaker] =
      useState("speaker_employee");
    const [internalIsRecording, setInternalIsRecording] = useState(false);
    const [internalIsProcessing, setInternalIsProcessing] = useState(false);
    const [consultationId, setConsultationId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [memo, setMemo] = useState("");
    const SPEAKER_SERVER_URL =
      process.env.REACT_APP_SPEAKER_SERVER_URL || "http://localhost:5005";

    const classifyTranscript = useCallback(
      async (text) => {
        try {
          const { data } = await axios.post(
            `${SPEAKER_SERVER_URL}/process-transcript`,
            {
              transcript: text,
              employee_id: employee?.employeeId || "",
            },
            { timeout: 5000 }
          );

          console.log("화자분리 서버 응답:", data);

          // 새로운 응답 형식 처리
          if (data?.speaker_id) {
            const isEmployee =
              data.speaker_name === "employee" ||
              data.speaker_id.includes("employee");
            return {
              speakerId: isEmployee ? "speaker_employee" : "speaker_customer",
              confidence: data.confidence ?? 0.8,
            };
          }

          // 기존 응답 형식 처리 (하위 호환성)
          const seg =
            Array.isArray(data?.segments) && data.segments.length
              ? data.segments[0]
              : null;
          if (seg?.speaker_label === "employee") {
            return {
              speakerId: "speaker_employee",
              confidence: seg.confidence ?? 0.8,
            };
          }
          if (seg?.speaker_label === "customer") {
            return {
              speakerId: "speaker_customer",
              confidence: seg.confidence ?? 0.8,
            };
          }
          return { speakerId: "speaker_employee", confidence: 0.8 };
        } catch (e) {
          console.warn(
            "/process-transcript 분류 실패, 기본값 사용",
            e?.message || e
          );
          return { speakerId: "speaker_employee", confidence: 0.8 };
        }
      },
      [SPEAKER_SERVER_URL, employee?.employeeId]
    );

    // MediaRecorder를 사용해 3초 단위 오디오 청크를 5005로 업로드
    const startMediaRecorder = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) return;
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          audioChunksRef.current = [];
          const form = new FormData();
          form.append("audio", blob, "chunk.webm");
          if (employee?.employeeId)
            form.append("employee_id", employee.employeeId);
          try {
            await axios.post(`${SPEAKER_SERVER_URL}/process-transcript`, form, {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 15000,
            });
          } catch (err) {
            console.warn("process-transcript 업로드 실패", err?.message || err);
          }
          // 재시작하여 주기적 전송
          setTimeout(() => {
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== "recording"
            ) {
              try {
                mediaRecorderRef.current.start();
              } catch (_) {}
              setTimeout(() => {
                try {
                  mediaRecorderRef.current.stop();
                } catch (_) {}
              }, 3000);
            }
          }, 0);
        };

        try {
          recorder.start();
        } catch (_) {}
        setTimeout(() => {
          try {
            recorder.stop();
          } catch (_) {}
        }, 3000);
      } catch (e) {
        console.warn("MediaRecorder 시작 실패", e?.message || e);
      }
    }, [SPEAKER_SERVER_URL, employee?.employeeId]);

    // 상담 요약 생성 함수
    const generateSummary = useCallback((transcript) => {
      if (!transcript || transcript.length < 10) {
        return "상담 내용이 부족합니다.";
      }
      const sentences = transcript
        .split(/[.!?]/)
        .filter((s) => s.trim().length > 0);
      if (sentences.length <= 2) {
        return transcript.substring(0, 100) + "...";
      }
      return sentences.slice(0, 2).join(". ") + "...";
    }, []);

    // 상담 세션 생성 함수
    const createConsultationSession = useCallback(async () => {
      console.log("🔍 상담 세션 생성 디버깅:", {
        employee: employee,
        employeeId: employee?.employeeId,
        customer: customer,
        customerId: customer?.CustomerID,
      });

      if (!employee?.employeeId) {
        console.error("❌ employee.employeeId가 없습니다:", employee);
        return null;
      }

      if (!customer?.CustomerID) {
        console.error("❌ customer.CustomerID가 없습니다:", customer);
        return null;
      }

      try {
        const sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const { data, error } = await supabase
          .from("consultation_history")
          .insert([
            {
              session_id: sessionId,
              employee_id: employee.employeeId,
              customer_id: customer.CustomerID,
              consultation_date: new Date().toISOString(),
              start_time: new Date().toISOString(),
              status: "in_progress",
              summary: "",
              transcript: "",
              memo: "",
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("상담 세션 생성 오류:", error);
          return null;
        }

        console.log("✅ 상담 세션 생성 성공:", sessionId);
        return sessionId;
      } catch (err) {
        console.error("상담 세션 생성 오류:", err);
        return null;
      }
    }, [employee?.employeeId, customer?.CustomerID]);

    // 상담 세션 업데이트 함수 (메모 포함)
    const updateConsultationSession = useCallback(
      async (sessionId, transcript, memoText) => {
        try {
          const { data, error } = await supabase
            .from("consultation_history")
            .update({
              end_time: new Date().toISOString(),
              status: "completed",
              transcript: transcript,
              memo: memoText,
              summary: generateSummary(transcript),
            })
            .eq("session_id", sessionId)
            .select()
            .single();

          if (error) {
            console.error("상담 세션 업데이트 오류:", error);
            return false;
          }

          return true;
        } catch (err) {
          console.error("상담 세션 업데이트 오류:", err);
          return false;
        }
      },
      [generateSummary]
    );

    // 음성 인식 초기화
    const initializeRecognition = useCallback(() => {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        console.error("음성 인식을 지원하지 않는 브라우저입니다.");
        onError?.("음성 인식을 지원하지 않는 브라우저입니다.");
        return false;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "ko-KR";

      recognitionRef.current.onstart = () => {
        setInternalIsRecording(true);
        onStartRecording?.();
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInternalInterimText(interimTranscript);
          onTranscript?.(interimTranscript, "SPEAKER_00");
        }

        if (finalTranscript) {
          // 화자 분류 서버(5005)에 전송하여 화자 결정
          classifyTranscript(finalTranscript).then((res) => {
            const decidedSpeakerId = res?.speakerId || "speaker_employee";
            const decidedConfidence =
              typeof res?.confidence === "number" ? res.confidence : 0.8;
            const newMessage = {
              id: Date.now(),
              speakerId: decidedSpeakerId,
              text: finalTranscript,
              timestamp: new Date(),
              confidence: decidedConfidence,
            };
            setInternalMessages((prev) => [...prev, newMessage]);
            setInternalInterimText("");
            onTranscript?.(
              finalTranscript,
              decidedSpeakerId === "speaker_employee"
                ? "SPEAKER_00"
                : "SPEAKER_01"
            );
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("음성 인식 오류:", event.error);
        onError?.(event.error);
      };

      recognitionRef.current.onend = () => {
        setInternalIsRecording(false);
        onStopRecording?.();
      };

      return true;
    }, [onTranscript, onError, onStartRecording, onStopRecording]);

    // 컴포넌트 마운트 시 음성 인식 초기화 + MediaRecorder 시작
    useEffect(() => {
      // 마이크는 항상 유지: 패널 가시성과 관계없이 초기화 및 자동 시작 한 번만
      const ok = initializeRecognition();
      if (ok && !internalIsRecording) {
        startRecording();
      }
      startMediaRecorder();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 메시지가 추가될 때마다 스크롤을 맨 아래로
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentInterimText]);

    const formatTime = (date) => {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    // 녹음 시작/중지 함수들
    const startRecording = useCallback(async () => {
      if (!recognitionRef.current) {
        if (!initializeRecognition()) {
          return;
        }
      }

      try {
        // 상담 세션 생성
        if (!consultationId) {
          const sessionId = await createConsultationSession();
          if (sessionId) {
            setConsultationId(sessionId);
            setStartTime(new Date());
          } else {
            console.error("상담 세션 생성 실패");
            return;
          }
        }

        recognitionRef.current.start();
      } catch (error) {
        console.error("녹음 시작 오류:", error);
        onError?.(error.message);
      }
    }, [
      consultationId,
      initializeRecognition,
      createConsultationSession,
      onError,
    ]);

    const stopRecording = useCallback(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, [recognitionRef]);

    const getSpeakerInfo = (speakerId) => {
      const isEmployee = speakerId.includes("employee");
      return {
        isEmployee,
        name: isEmployee ? "행원" : "고객",
        avatar: isEmployee ? "👨‍💼" : "👤",
        color: isEmployee ? "#667eea" : "#4caf50",
      };
    };

    const handleToggleRecording = () => {
      if (internalIsRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };

    // 상담 종료 및 저장 함수
    const finalizeConsultation = useCallback(async () => {
      if (!consultationId) {
        console.log("저장할 상담 세션이 없습니다.");
        return;
      }

      try {
        // 전체 대화 내용을 텍스트로 변환
        const transcript = internalMessages
          .map(
            (msg) =>
              `${msg.speakerId.includes("employee") ? "행원" : "고객"}: ${
                msg.text
              }`
          )
          .join("\n");

        // 상담 세션 업데이트 (메모 포함)
        const success = await updateConsultationSession(
          consultationId,
          transcript,
          memo
        );

        if (success) {
          console.log("✅ 상담 세션 저장 완료");
          // 메모 초기화
          setMemo("");
          setInternalMessages([]);
          setInternalInterimText("");
          setConsultationId(null);
          setStartTime(null);
        } else {
          console.error("❌ 상담 세션 저장 실패");
        }
      } catch (error) {
        console.error("상담 세션 저장 중 오류:", error);
      }
    }, [consultationId, internalMessages, memo, updateConsultationSession]);

    // 외부에서 호출할 수 있는 함수들을 노출
    useImperativeHandle(
      ref,
      () => ({
        finalizeConsultation,
        hasActiveSession: !!consultationId,
        getMessages: () => internalMessages,
        getMemo: () => memo,
      }),
      [finalizeConsultation, consultationId, internalMessages, memo]
    );

    return (
      <ChatContainer isVisible={isVisible}>
        <ChatHeader>
          <ChatTitle>🎤 실시간 상담 채팅</ChatTitle>
          <CloseButton onClick={onClose} title="채팅창 닫기">
            ×
          </CloseButton>
        </ChatHeader>

        <ChatStatus>
          <StatusDot
            isRecording={internalIsRecording}
            isProcessing={internalIsProcessing}
          />
          <span>
            {internalIsProcessing
              ? "화자 분리 처리중..."
              : internalIsRecording
              ? "실시간 음성 인식 중..."
              : "대기중"}
          </span>
        </ChatStatus>

        <MessagesArea>
          {internalMessages.length === 0 && !internalInterimText ? (
            <EmptyState>
              <EmptyIcon>💬</EmptyIcon>
              <EmptyText>
                마이크 버튼을 눌러
                <br />
                실시간 음성 인식을 시작하세요
              </EmptyText>
            </EmptyState>
          ) : (
            <>
              {internalMessages.map((message) => {
                const speakerInfo = getSpeakerInfo(message.speakerId);
                return (
                  <MessageBubble
                    key={message.id}
                    isEmployee={speakerInfo.isEmployee}
                  >
                    <MessageHeader>
                      <SpeakerInfo>
                        <SpeakerAvatar isEmployee={speakerInfo.isEmployee}>
                          {speakerInfo.avatar}
                        </SpeakerAvatar>
                        <SpeakerName>{speakerInfo.name}</SpeakerName>
                      </SpeakerInfo>
                      <MessageTime>{formatTime(message.timestamp)}</MessageTime>
                      <span style={{ fontSize: "10px", color: "#999" }}>
                        ({(message.confidence * 100).toFixed(1)}%)
                      </span>
                    </MessageHeader>
                    <MessageContent isEmployee={speakerInfo.isEmployee}>
                      {message.text}
                    </MessageContent>
                  </MessageBubble>
                );
              })}

              {internalInterimText && (
                <MessageBubble
                  isEmployee={internalCurrentSpeaker.includes("employee")}
                >
                  <MessageHeader>
                    <SpeakerInfo>
                      <SpeakerAvatar
                        isEmployee={internalCurrentSpeaker.includes("employee")}
                      >
                        {internalCurrentSpeaker.includes("employee")
                          ? "👨‍💼"
                          : "👤"}
                      </SpeakerAvatar>
                      <SpeakerName>
                        {internalCurrentSpeaker.includes("employee")
                          ? "행원"
                          : "고객"}
                      </SpeakerName>
                    </SpeakerInfo>
                    <MessageTime>인식 중...</MessageTime>
                  </MessageHeader>
                  <MessageContent
                    isEmployee={internalCurrentSpeaker.includes("employee")}
                    className="interim"
                  >
                    {internalInterimText}
                  </MessageContent>
                </MessageBubble>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </MessagesArea>

        <ChatControls>{/* controls removed */}</ChatControls>

        {/* 행원 메모 섹션 */}
        <MemoSection>
          <MemoTitle>📝 행원 메모</MemoTitle>
          <MemoTextarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="상담 내용에 대한 메모를 작성하세요..."
          />
          {/* save button removed */}
        </MemoSection>
      </ChatContainer>
    );
  }
);

export default RealtimeChat;

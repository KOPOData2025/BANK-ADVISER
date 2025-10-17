import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const STTContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1000;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const STTHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const CloseButton = styled.button`
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-left: 10px;

  &:hover {
    background: #ff3742;
    transform: scale(1.1);
  }
`;

const STTTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;

const STTButton = styled.button`
  background: ${(props) => (props.isRecording ? "#ff4757" : "#2ed573")};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => (props.isRecording ? "#ff3742" : "#26d065")};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
    if (props.isRecording) return "#ff4757";
    if (props.isProcessing) return "#ffa502";
    return "#2ed573";
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

const StatusText = styled.span`
  font-size: 14px;
  color: #666;
`;

const SpeakerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
`;

const SpeakerAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => {
    if (props.speakerId.includes("employee")) return "#2196f3";
    if (props.speakerId.includes("customer")) return "#4caf50";
    return "#6c757d";
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
`;

const SpeakerDetails = styled.div`
  flex: 1;
`;

const SpeakerName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #333;
`;

const SpeakerConfidence = styled.div`
  font-size: 12px;
  color: #666;
`;

const TranscriptArea = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  flex: 1;
`;

const MessageBubble = styled.div`
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: ${(props) =>
    props.speakerId.includes("employee") ? "flex-end" : "flex-start"};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: #999;
`;

const MessageContent = styled.div`
  background: ${(props) => {
    if (props.speakerId.includes("employee")) return "#2196f3";
    if (props.speakerId.includes("customer")) return "#4caf50";
    return "#6c757d";
  }};
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 80%;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.4;

  &.interim {
    opacity: 0.7;
    background: ${(props) => {
      if (props.speakerId.includes("employee")) return "#64b5f6";
      if (props.speakerId.includes("customer")) return "#81c784";
      return "#adb5bd";
    }};
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const ControlButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #5a6268;
  }
`;

const ErrorMessage = styled.div`
  background: #ffe6e6;
  color: #d63031;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 10px;
`;

const ProcessingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #856404;
`;

const PyannoteSTT = React.forwardRef(
  (
    { onTranscript, onError, isEnabled = true, employee, customer, onClose },
    ref
  ) => {
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [isAutoRestart, setIsAutoRestart] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [speakers, setSpeakers] = useState({});
    const [currentInterimText, setCurrentInterimText] = useState("");
    const [currentSpeaker, setCurrentSpeaker] = useState("speaker_employee");
    const [consultationId, setConsultationId] = useState(null);
    const [startTime, setStartTime] = useState(null);

    const recognitionRef = useRef(null);
    const audioChunksRef = useRef([]);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const pyannoteWorkerRef = useRef(null);

    // 상담내역 저장 함수들
    const createConsultationSession = async () => {
      try {
        const { supabase } = await import("../../config/supabase");

        const sessionId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        const customerId = customer?.CustomerID || customer?.id || "UNKNOWN";
        const employeeId = employee?.id || employee?.employeeId || "UNKNOWN";

        // 1) 세션 생성 (consultation_sessions)
        const { error: sessionErr } = await supabase
          .from("consultation_sessions")
          .insert({
            session_id: sessionId,
            customer_id: customerId,
            employee_id: employeeId,
            session_start_time: new Date().toISOString(),
            session_end_time: new Date().toISOString(), // 시작과 동일하게 설정 (나중에 종료 시 업데이트)
            full_transcript: "", // 빈 문자열로 초기화
            message_count: 0, // total_messages → message_count
            duration_seconds: 0,
            status: "in_progress",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (sessionErr) {
          console.error("상담 세션 생성 실패:", sessionErr);
          return null;
        }

        // 2) 히스토리 초기 레코드 준비 (consultation_id 컬럼 없음)
        const { error: historyErr } = await supabase
          .from("consultation_history")
          .insert({
            customer_id: customerId,
            employee_id: employeeId,
            status: "in_progress",
            consultation_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (historyErr) {
          console.warn("consultation_history 초기화 경고:", historyErr.message);
        }

        console.log("✅ 상담 세션 생성됨:", sessionId);
        return sessionId;
      } catch (err) {
        console.error("상담 세션 생성 오류:", err);
        return null;
      }
    };

    const saveMessageToConsultation = async (messageData) => {
      console.log("💾 메시지 메모리 저장:", messageData);
      console.log("📋 consultationId:", consultationId);

      let currentConsultationId = consultationId;

      // consultationId가 없으면 자동으로 생성
      if (!currentConsultationId) {
        console.log("🔄 상담 세션 자동 생성 중...");
        currentConsultationId = await createConsultationSession();
        if (currentConsultationId) {
          setConsultationId(currentConsultationId);
          setStartTime(new Date());
          console.log("✅ 상담 세션 자동 생성 완료:", currentConsultationId);
        } else {
          console.error("❌ 상담 세션 생성 실패");
          return;
        }
      }

      // 실시간 DB 저장 대신 메모리에만 보관 (채팅창처럼)
      console.log("💬 메시지가 채팅창에 추가됨:", messageData.transcript);
      console.log("📝 전체 메시지 수:", messages.length + 1);

      // 메시지는 이미 messages 상태에 추가되어 있음
      // DB 저장은 상담 종료 시 한 번에 처리
    };

    const updateConsultationSummary = async () => {
      if (!consultationId) return;

      try {
        const { supabase } = await import("../../config/supabase");

        const duration = startTime
          ? Math.floor((Date.now() - startTime.getTime()) / 1000)
          : 0;
        const summary = `상담 메시지 ${messages.length}개, 소요시간 ${duration}초`;

        const customerId = customer?.CustomerID || customer?.id || "UNKNOWN";
        const employeeId = employee?.id || employee?.employeeId || "UNKNOWN";
        const endTime = new Date().toISOString();

        // 전체 대화 내용을 하나의 텍스트로 합치기
        const fullTranscript = messages
          .map((msg) => {
            const speaker =
              msg.speakerId && msg.speakerId.includes("employee")
                ? "행원"
                : "고객";
            const text =
              msg.transcript || msg.text || msg.message || msg.content || "";
            return `${speaker}: ${text}`;
          })
          .join("\n");

        // 1) consultation_sessions의 session_end_time 및 full_transcript 업데이트
        const { error: sessionUpdateError } = await supabase
          .from("consultation_sessions")
          .update({
            session_end_time: endTime,
            full_transcript: fullTranscript,
            message_count: messages.length, // total_messages → message_count
            duration_seconds: duration,
            status: "completed",
            updated_at: endTime,
          })
          .eq("session_id", consultationId);

        // 2) 전체 대화를 하나의 텍스트로 저장 (사용자 요청사항)
        if (messages.length > 0) {
          console.log("💾 전체 대화 내용을 하나의 텍스트로 저장 중...");

          // 각 메시지를 "고객: 내용" 또는 "행원: 내용" 형식으로 변환
          console.log("🔍 메시지 데이터 확인:", messages);

          const formattedMessages = messages
            .map((msg) => {
              console.log("🔍 개별 메시지 데이터:", msg);

              // speakerId 또는 speaker_name에서 화자 구분
              let speaker = "고객"; // 기본값
              if (msg.speakerId && msg.speakerId.includes("employee")) {
                speaker = "행원";
              } else if (
                msg.speakerName === "employee" ||
                msg.speakerName === "행원"
              ) {
                speaker = "행원";
              }

              // transcript, text, message 등에서 텍스트 추출
              const text =
                msg.transcript || msg.text || msg.message || msg.content || "";

              return `${speaker}: ${text}`;
            })
            .join("\n");

          console.log("📝 저장할 대화 내용:", formattedMessages);

          // consultation_messages에 전체 대화를 하나의 메시지로 저장
          const { error: messagesError } = await supabase
            .from("consultation_messages")
            .insert({
              consultation_id: consultationId,
              speaker_type: "customer", // 제약조건에 맞게 'customer' 사용
              speaker_name: "전체 대화",
              message_text: formattedMessages,
              confidence_score: 1.0,
              timestamp: new Date().toISOString(),
            });

          if (messagesError) {
            console.error("❌ 전체 대화 저장 실패:", messagesError);
          } else {
            console.log("✅ 전체 대화 저장 완료");
          }
        }

        if (sessionUpdateError) {
          console.error("세션 종료 시간 업데이트 실패:", sessionUpdateError);
        }

        // 2) consultation_history 요약 저장 (새 레코드로 저장)
        const { error } = await supabase.from("consultation_history").insert({
          customer_id: customerId,
          employee_id: employeeId,
          consultation_date: new Date().toISOString(),
          duration_seconds: duration,
          total_messages: messages.length,
          summary: summary,
          status: "completed",
          created_at: new Date().toISOString(),
          updated_at: endTime,
        });

        if (error) {
          console.error("상담 요약 업데이트 실패:", error);
        } else {
          console.log("✅ 상담 요약 업데이트됨");
        }
      } catch (err) {
        console.error("상담 요약 업데이트 오류:", err);
      }
    };

    useEffect(() => {
      // 브라우저 지원 확인
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          setIsSupported(true);
          recognitionRef.current = new SpeechRecognition();

          // 설정
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = "ko-KR";

          // 이벤트 핸들러
          recognitionRef.current.onstart = () => {
            console.log("🎤 Pyannote 음성 인식 시작");
            setIsRecording(true);
            setIsAutoRestart(true);
            setError(null);
          };

          recognitionRef.current.onresult = (event) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            // 실시간 중간 결과 표시
            if (interimTranscript) {
              console.log("🔄 실시간 인식 중:", interimTranscript);
              setCurrentInterimText(interimTranscript);
            }

            // 최종 결과 처리
            if (finalTranscript) {
              console.log("✅ 최종 인식 결과:", finalTranscript);

              // Pyannote.audio로 화자 분리 처리
              processSpeakerSeparation(finalTranscript);
            }
          };

          recognitionRef.current.onerror = (event) => {
            console.error("❌ 음성 인식 오류:", event.error);
            setError(`음성 인식 오류: ${event.error}`);
            setIsRecording(false);
            onError && onError(event.error);
          };

          recognitionRef.current.onend = () => {
            console.log("🛑 음성 인식 종료");
            setIsRecording(false);

            // isAutoRestart 상태를 확인하여 자동 재시작 여부 결정
            if (isAutoRestart) {
              setTimeout(() => {
                // 재시작 전에 다시 한번 isAutoRestart 상태 확인
                if (isAutoRestart) {
                  try {
                    recognitionRef.current.start();
                    console.log("🔄 음성 인식 자동 재시작");
                  } catch (err) {
                    console.log("음성 인식 재시작 실패:", err);
                  }
                } else {
                  console.log("🛑 자동 재시작 비활성화됨 - 재시작하지 않음");
                }
              }, 100);
            } else {
              console.log("🛑 자동 재시작 비활성화됨");
            }
          };
        } else {
          setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
          setIsSupported(false);
        }
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }, [onTranscript, onError, isAutoRestart]);

    // 컴포넌트가 활성화되면 자동으로 녹음 시작
    useEffect(() => {
      if (isEnabled && isSupported && !isRecording) {
        console.log("🎤 PyannoteSTT 자동 녹음 시작 조건 확인:", {
          isEnabled,
          isSupported,
          isRecording,
          hasRecognition: !!recognitionRef.current,
        });

        // 약간의 지연 후 녹음 시작 (컴포넌트 초기화 완료 후)
        const timer = setTimeout(() => {
          console.log("🎤 PyannoteSTT 자동 녹음 시작");
          startRecording();
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [isEnabled, isSupported]);

    // Pyannote.audio 화자 분리 처리 (저장된 행원 음성 프로필 활용)
    const processSpeakerSeparation = async (transcript) => {
      setIsProcessing(true);

      try {
        // 저장된 행원 음성 프로필이 있는지 확인
        let employeeVoiceProfile = null;
        if (employee?.id) {
          try {
            const { supabase } = await import("../../config/supabase");
            const { data, error } = await supabase
              .from("voice_profiles")
              .select("audio_file_url, confidence_score")
              .eq("employee_id", employee.id)
              .single();

            if (!error && data) {
              employeeVoiceProfile = data;
              console.log("🎤 저장된 행원 음성 프로필 발견:", data);
            }
          } catch (err) {
            console.warn("행원 음성 프로필 조회 실패:", err);
          }
        }

        // 최근 1~2초 오디오 스니핏 캡처 (가능한 경우)
        let audioBase64 = null;
        try {
          if (!mediaRecorderRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream, {
              mimeType: "audio/webm;codecs=opus",
            });
          }

          audioChunksRef.current = [];
          const rec = mediaRecorderRef.current;
          await new Promise((resolve) => {
            rec.ondataavailable = (e) => {
              if (e.data && e.data.size > 0)
                audioChunksRef.current.push(e.data);
            };
            rec.onstop = () => resolve();
            rec.start();
            setTimeout(() => {
              try {
                rec.stop();
              } catch (_) {}
            }, 1200);
          });

          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });
          const arrayBuffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++)
            binary += String.fromCharCode(bytes[i]);
          audioBase64 = btoa(binary);
        } catch (e) {
          console.warn("오디오 스니핏 캡처 실패 (텍스트만 전송):", e);
        }

        // 커스텀 화자 분리 서버에 요청 전송 (행원 음성 프로필 + base64 오디오 포함)
        const pyannoteUrl =
          process.env.REACT_APP_PYANNOTE_URL || "http://localhost:5005";
        const response = await fetch(`${pyannoteUrl}/process-transcript`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: transcript,
            employee_voice_profile: employeeVoiceProfile,
            employee_id: employee?.id,
            audio_base64: audioBase64,
            audio_mime: audioBase64 ? "audio/webm" : null,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success !== false) {
          // Normalize speakerId so UI consistently recognizes employee/customer
          const normalizedSpeakerId =
            (result.speaker_name || "").toLowerCase() === "employee"
              ? "speaker_employee"
              : "speaker_customer";

          // Overlap 처리: 서버가 overlap_transcript 주면 우선 사용
          let displayedText = transcript;
          if (result.overlap) {
            if (result.overlap_transcript && result.overlap_transcript.trim()) {
              displayedText = result.overlap_transcript.trim();
            } else {
              displayedText = "[동시 발화 구간: 텍스트 인식 불가능]";
            }
          }

          const newMessage = {
            id: Date.now(),
            speakerId: normalizedSpeakerId,
            text: displayedText,
            timestamp: new Date(),
            confidence: result.confidence ?? 0.8,
            similarity:
              typeof result.similarity === "number"
                ? result.similarity
                : undefined,
            overlap: !!result.overlap,
            decisionReason: result.decision_reason,
            isInterim: false,
          };

          setMessages((prev) => [...prev, newMessage]);
          setCurrentInterimText("");

          // 화자 정보 업데이트
          updateSpeakerInfo(
            normalizedSpeakerId,
            displayedText,
            result.speaker_name
          );

          // 디버깅: 서버 응답 로그 (개발 환경에서만)
          if (process.env.NODE_ENV === "development") {
            console.log("🔍 [PyannoteSTT] 서버 응답:", result);
            console.log(
              "🔍 [PyannoteSTT] 신뢰도:",
              result.confidence,
              "타입:",
              typeof result.confidence
            );
          }

          // 상담내역에 메시지 저장 (표시 텍스트 그대로 저장)
          await saveMessageToConsultation({
            speakerId: normalizedSpeakerId,
            speakerName: result.speaker_name,
            transcript: displayedText,
            confidence: result.confidence ?? 0.8,
          });

          onTranscript &&
            onTranscript(
              displayedText,
              normalizedSpeakerId,
              result.confidence ?? 0.8
            );
        } else {
          throw new Error(result.error || "화자 분리 처리 실패");
        }
      } catch (err) {
        console.error("화자 분리 처리 실패:", err);

        // 서버 연결 실패 시 로컬 휴리스틱 사용
        console.log("🔄 로컬 휴리스틱으로 화자 분리 수행");
        const speakerId = await simulateSpeakerSeparation(transcript);

        const newMessage = {
          id: Date.now(),
          speakerId: speakerId,
          text: transcript,
          timestamp: new Date(),
          confidence: 0.7,
          isInterim: false,
        };

        setMessages((prev) => [...prev, newMessage]);
        setCurrentInterimText("");
        updateSpeakerInfo(speakerId, transcript);
        onTranscript && onTranscript(transcript, speakerId, 0.7);
      } finally {
        setIsProcessing(false);
      }
    };

    // 화자 분리 시뮬레이션 (저장된 행원 음성 프로필 활용)
    const simulateSpeakerSeparation = async (transcript) => {
      console.log("🔍 화자 분리 분석 시작:", transcript);

      // 저장된 행원 음성 프로필이 있는지 확인
      let hasEmployeeProfile = false;
      if (employee?.id) {
        try {
          const { supabase } = await import("../../config/supabase");
          const { data, error } = await supabase
            .from("voice_profiles")
            .select("id")
            .eq("employee_id", employee.id)
            .single();

          if (!error && data) {
            hasEmployeeProfile = true;
            console.log("🎤 저장된 행원 음성 프로필 활용 가능");
          }
        } catch (err) {
          console.warn("행원 음성 프로필 확인 실패:", err);
        }
      }

      // 고객 질문 패턴 (더 정확한 분류)
      const customerQuestionPatterns = [
        /가입하려면.*필요/,
        /어떤.*서류.*필요/,
        /신청하려면.*어떻게/,
        /궁금한.*있어/,
        /알고.*싶어/,
        /도와주세요/,
        /알려주세요/,
        /어떻게.*하나요/,
        /무엇.*필요/,
        /언제.*가능/,
        /어디서.*할.*수/,
        /왜.*그런/,
        /얼마나.*걸리/,
        /비용.*얼마/,
        /혜택.*뭐/,
        /조건.*뭐/,
        /자격.*뭐/,
        /절차.*어떻게/,
        /나.*신분증.*보여.*주시겠어요/, // 고객이 행원에게 신분증 보여달라고 요청
        /전.*그거.*상품.*가입하려고요/, // 고객이 상품 가입 의도 표현
      ];

      // 행원 답변 패턴
      const employeeAnswerPatterns = [
        /필요한.*서류는/,
        /가입.*절차는/,
        /신청.*방법은/,
        /도움.*드리겠습니다/,
        /안내.*드리겠습니다/,
        /설명.*드리겠습니다/,
        /추천.*드리겠습니다/,
        /혜택.*있습니다/,
        /조건.*충족/,
        /자격.*되시면/,
        /절차.*진행/,
        /상품.*소개/,
        /금리.*정보/,
        /가입.*가능/,
        /신청.*가능/,
        /네.*고객님/, // 행원이 고객을 부르는 패턴
        /신분증.*보시겠어요/, // 행원이 고객에게 신분증 보여달라고 요청
        /어떤.*일로.*오셨을까요/, // 행원의 인사말
      ];

      // 고객 질문 점수 계산
      const customerScore = customerQuestionPatterns.filter((pattern) =>
        pattern.test(transcript)
      ).length;

      // 행원 답변 점수 계산
      const employeeScore = employeeAnswerPatterns.filter((pattern) =>
        pattern.test(transcript)
      ).length;

      // 질문 마커 확인
      const hasQuestionMark =
        transcript.includes("?") ||
        transcript.includes("요?") ||
        transcript.includes("나요?");

      // 고객 질문 키워드
      const customerKeywords = [
        "가입하려면",
        "신청하려면",
        "어떤",
        "무엇",
        "언제",
        "어디",
        "왜",
        "어떻게",
        "궁금",
        "알고싶어",
        "도와주세요",
        "알려주세요",
        "필요하죠",
        "필요해요",
        "얼마나",
        "비용",
        "혜택",
        "조건",
        "자격",
        "절차",
        "전", // "전 그거 상품 가입하려고요"에서 "전"
        "나", // "나 신분증 보여 주시겠어요"에서 "나"
      ];

      // 행원 답변 키워드
      const employeeKeywords = [
        "필요한",
        "절차는",
        "방법은",
        "드리겠습니다",
        "안내",
        "설명",
        "추천",
        "있습니다",
        "충족",
        "되시면",
        "진행",
        "소개",
        "정보",
        "가능",
        "고객님", // "네 고객님"에서
        "보시겠어요", // "신분증 보시겠어요"에서
        "오셨을까요", // "어떤 일로 오셨을까요"에서
      ];

      const customerKeywordScore = customerKeywords.filter((keyword) =>
        transcript.includes(keyword)
      ).length;

      const employeeKeywordScore = employeeKeywords.filter((keyword) =>
        transcript.includes(keyword)
      ).length;

      console.log("📊 화자 분리 분석 결과:");
      console.log("- 고객 질문 패턴 점수:", customerScore);
      console.log("- 행원 답변 패턴 점수:", employeeScore);
      console.log("- 고객 키워드 점수:", customerKeywordScore);
      console.log("- 행원 키워드 점수:", employeeKeywordScore);
      console.log("- 질문 마커 있음:", hasQuestionMark);
      console.log("- 행원 프로필 있음:", hasEmployeeProfile);

      // 종합 판단 로직
      let finalScore = 0;

      // 질문 패턴이 강하면 고객
      if (customerScore > 0) finalScore -= customerScore * 2;
      if (employeeScore > 0) finalScore += employeeScore * 2;

      // 키워드 점수
      finalScore -= customerKeywordScore;
      finalScore += employeeKeywordScore;

      // 질문 마커가 있으면 고객으로 분류
      if (hasQuestionMark) finalScore -= 3;

      // 저장된 행원 프로필이 있으면 더 정확한 분류 가능
      if (hasEmployeeProfile) {
        // 행원 프로필이 있으면 더 엄격한 기준 적용
        if (finalScore <= 0) {
          console.log("🎯 최종 결과: 고객 (행원 프로필 활용)");
          return "SPEAKER_01"; // 고객
        } else {
          console.log("🎯 최종 결과: 행원 (행원 프로필 활용)");
          return "speaker_employee"; // 행원
        }
      } else {
        // 프로필이 없으면 기존 로직 사용
        if (finalScore <= 0) {
          console.log("🎯 최종 결과: 고객 (기본 로직)");
          return "SPEAKER_01"; // 고객
        } else {
          console.log("🎯 최종 결과: 행원 (기본 로직)");
          return "speaker_employee"; // 행원
        }
      }
    };

    // 화자 정보 업데이트
    const updateSpeakerInfo = (speakerId, transcript, speakerName = null) => {
      setSpeakers((prev) => ({
        ...prev,
        [speakerId]: {
          id: speakerId,
          name:
            speakerName || (speakerId.includes("employee") ? "행원" : "고객"),
          messageCount: (prev[speakerId]?.messageCount || 0) + 1,
          lastMessage: transcript,
          lastActivity: new Date(),
          confidence: Math.random() * 0.3 + 0.7,
        },
      }));
    };

    const startRecording = async () => {
      console.log("🎤 startRecording 호출됨:", {
        hasRecognition: !!recognitionRef.current,
        isRecording,
        isEnabled,
        isSupported,
      });

      if (recognitionRef.current && !isRecording) {
        try {
          // 상담 세션 생성
          const sessionId = await createConsultationSession();
          if (sessionId) {
            setConsultationId(sessionId);
            setStartTime(new Date());
            console.log("🎯 상담 세션 시작:", sessionId);
          }

          console.log("🎤 recognitionRef.current.start() 호출");
          recognitionRef.current.start();
        } catch (err) {
          console.error("녹음 시작 실패:", err);
          setError("녹음을 시작할 수 없습니다: " + err.message);
        }
      } else {
        console.log("🎤 녹음 시작 조건 불만족:", {
          hasRecognition: !!recognitionRef.current,
          isRecording,
          reason: !recognitionRef.current
            ? "recognitionRef 없음"
            : "이미 녹음 중",
        });
      }
    };

    const stopRecording = async () => {
      if (recognitionRef.current && isRecording) {
        console.log("🛑 stopRecording 호출 - 자동 재시작 비활성화");
        setIsAutoRestart(false);
        recognitionRef.current.stop();

        // 추가로 abort() 호출하여 완전히 중지
        if (typeof recognitionRef.current.abort === "function") {
          recognitionRef.current.abort();
        }

        // 상담 세션 종료 및 요약 업데이트
        if (consultationId) {
          await updateConsultationSummary();
          console.log("🎯 상담 세션 종료:", consultationId);
        }
      }
    };

    // 녹음 상태와 무관하게 세션을 정리하고 요약을 저장
    const finalizeSession = async () => {
      try {
        console.log("🧾 finalizeSession 시작 - 자동 재시작 비활성화");
        setIsAutoRestart(false);

        // 음성 인식 완전 중지
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          // 추가로 abort() 호출하여 완전히 중지
          if (typeof recognitionRef.current.abort === "function") {
            recognitionRef.current.abort();
          }
        }

        if (consultationId) {
          await updateConsultationSummary();
          console.log("🧾 상담 세션 요약 저장 완료:", consultationId);
        } else {
          console.log("⚠️ consultationId 없음 - 요약 저장 건너뜀");
        }
      } catch (e) {
        console.error("❌ finalizeSession 오류:", e);
      }
    };

    // ref를 통해 외부에서 호출할 수 있도록 expose
    React.useImperativeHandle(ref, () => ({
      stopRecording,
      finalizeSession,
      startRecording,
      clearMessages,
    }));

    const toggleRecording = () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };

    const clearMessages = () => {
      setMessages([]);
      setCurrentInterimText("");
      setSpeakers({});
    };

    const formatTime = (date) => {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    if (!isEnabled || !isSupported) {
      return (
        <STTContainer>
          <STTTitle>🎤 Pyannote 화자 분리</STTTitle>
          <ErrorMessage>
            {!isSupported
              ? "이 브라우저는 음성 인식을 지원하지 않습니다."
              : "음성 인식이 비활성화되어 있습니다."}
          </ErrorMessage>
        </STTContainer>
      );
    }

    return (
      <STTContainer>
        <STTHeader>
          <STTTitle>🎤 Pyannote 화자 분리</STTTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <STTButton
              onClick={toggleRecording}
              disabled={!isSupported}
              isRecording={isRecording}
            >
              {isRecording ? "중지" : "시작"}
            </STTButton>
            {onClose && (
              <CloseButton
                onClick={async () => {
                  // 모달 닫기 전에 세션 정리 및 저장
                  await finalizeSession();
                  onClose();
                }}
                title="닫기"
              >
                ×
              </CloseButton>
            )}
          </div>
        </STTHeader>

        <StatusIndicator>
          <StatusDot isRecording={isRecording} isProcessing={isProcessing} />
          <StatusText>
            {isProcessing
              ? "화자 분리 처리중..."
              : isRecording
              ? "실시간 인식 중..."
              : isAutoRestart
              ? "연속 모드 대기중..."
              : "대기중"}
          </StatusText>
        </StatusIndicator>

        {isProcessing && (
          <ProcessingIndicator>
            🔄 Pyannote.audio로 화자 분리 중...
          </ProcessingIndicator>
        )}

        {/* 화자 정보 표시 */}
        {Object.keys(speakers).length > 0 && (
          <SpeakerInfo>
            {Object.values(speakers).map((speaker) => (
              <div
                key={speaker.id}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <SpeakerAvatar speakerId={speaker.id}>
                  {speaker.id.includes("employee") ? "👨‍💼" : "👤"}
                </SpeakerAvatar>
                <SpeakerDetails>
                  <SpeakerName>{speaker.name}</SpeakerName>
                  <SpeakerConfidence>
                    신뢰도: {(speaker.confidence * 100).toFixed(1)}% | 메시지:{" "}
                    {speaker.messageCount}개
                  </SpeakerConfidence>
                </SpeakerDetails>
              </div>
            ))}
          </SpeakerInfo>
        )}

        <TranscriptArea>
          {messages.map((message) => (
            <MessageBubble key={message.id} speakerId={message.speakerId}>
              <MessageHeader>
                <span>
                  {message.speakerId.includes("employee")
                    ? "👨‍💼 행원"
                    : "👤 고객"}
                </span>
                <MessageTime>{formatTime(message.timestamp)}</MessageTime>
                <span style={{ fontSize: "10px", color: "#999" }}>
                  ({(message.confidence * 100).toFixed(1)}%)
                </span>
                {typeof message.similarity === "number" && (
                  <span style={{ fontSize: "10px", color: "#999" }}>
                    · sim {(message.similarity * 100).toFixed(0)}%
                  </span>
                )}
                {message.overlap && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#b07100",
                      background: "#fff3cd",
                      border: "1px solid #ffeaa7",
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    동시발화
                  </span>
                )}
              </MessageHeader>
              <MessageContent speakerId={message.speakerId}>
                {message.text}
              </MessageContent>
            </MessageBubble>
          ))}

          {currentInterimText && (
            <MessageBubble speakerId={currentSpeaker}>
              <MessageHeader>
                <span>
                  {currentSpeaker.includes("employee") ? "👨‍💼 행원" : "👤 고객"}
                </span>
                <MessageTime>인식 중...</MessageTime>
              </MessageHeader>
              <MessageContent speakerId={currentSpeaker} className="interim">
                {currentInterimText}
              </MessageContent>
            </MessageBubble>
          )}

          {messages.length === 0 && !currentInterimText && (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                fontStyle: "italic",
                marginTop: "50px",
              }}
            >
              Pyannote.audio로 자동 화자 분리된 음성 인식 결과가 여기에
              표시됩니다...
            </div>
          )}
        </TranscriptArea>

        <Controls>
          <ControlButton onClick={clearMessages}>대화 초기화</ControlButton>
        </Controls>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </STTContainer>
    );
  }
);

export default PyannoteSTT;

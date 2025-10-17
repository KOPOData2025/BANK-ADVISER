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
  min-width: 300px;
  max-width: 400px;
`;

const STTHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
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

const TranscriptArea = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
`;

const TranscriptText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;

  .interim {
    color: #666;
    font-style: italic;
    opacity: 0.7;
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

const SimpleSTT = ({ onTranscript, onError, isEnabled = true }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isAutoRestart, setIsAutoRestart] = useState(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

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
        recognitionRef.current.lang = "ko-KR"; // 한국어

        // 이벤트 핸들러
        recognitionRef.current.onstart = () => {
          console.log("🎤 음성 인식 시작");
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

          // 실시간 중간 결과 표시 (회색으로)
          if (interimTranscript) {
            console.log("🔄 실시간 인식 중:", interimTranscript);
            setTranscript((prev) => {
              // 이전 최종 결과만 유지하고 중간 결과 추가
              const finalOnly = prev.replace(
                /<span class="interim">.*?<\/span>/g,
                ""
              );
              return (
                finalOnly + `<span class="interim">${interimTranscript}</span>`
              );
            });
          }

          // 최종 결과 처리
          if (finalTranscript) {
            console.log("✅ 최종 인식 결과:", finalTranscript);
            finalTranscriptRef.current += finalTranscript + " ";
            setTranscript((prev) => {
              // 중간 결과 제거하고 최종 결과 추가
              const cleanPrev = prev.replace(
                /<span class="interim">.*?<\/span>/g,
                ""
              );
              return cleanPrev + finalTranscript + " ";
            });
            onTranscript && onTranscript(finalTranscript);
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

          // 연속 음성 인식을 위해 자동으로 다시 시작 (사용자가 중지하지 않은 경우)
          if (isAutoRestart) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                console.log("🔄 음성 인식 자동 재시작");
              } catch (err) {
                console.log("음성 인식 재시작 실패:", err);
              }
            }, 100);
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
  }, [onTranscript, onError]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("녹음 시작 실패:", err);
        setError("녹음을 시작할 수 없습니다: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      setIsAutoRestart(false); // 자동 재시작 비활성화
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    finalTranscriptRef.current = "";
  };

  if (!isEnabled || !isSupported) {
    return (
      <STTContainer>
        <STTTitle>🎤 음성 인식</STTTitle>
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
        <STTTitle>🎤 실시간 음성 인식</STTTitle>
        <STTButton
          onClick={toggleRecording}
          disabled={!isSupported}
          isRecording={isRecording}
        >
          {isRecording ? "중지" : "시작"}
        </STTButton>
      </STTHeader>

      <StatusIndicator>
        <StatusDot isRecording={isRecording} />
        <StatusText>
          {isRecording
            ? "실시간 인식 중..."
            : isAutoRestart
            ? "연속 모드 대기중..."
            : "대기중"}
        </StatusText>
      </StatusIndicator>

      <TranscriptArea>
        <TranscriptText
          dangerouslySetInnerHTML={{
            __html: transcript || "음성 인식 결과가 여기에 표시됩니다...",
          }}
        />
      </TranscriptArea>

      {transcript && (
        <STTButton
          onClick={clearTranscript}
          style={{ marginTop: "10px", background: "#6c757d" }}
        >
          초기화
        </STTButton>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </STTContainer>
  );
};

export default SimpleSTT;

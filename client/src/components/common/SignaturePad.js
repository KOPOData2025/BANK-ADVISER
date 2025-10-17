import React, { useRef, useEffect, useState } from "react";
import styles from "./SignaturePad.module.css";

const SignaturePad = ({ onSave, onCancel, fieldLabel = "서명" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 캔버스 스타일 설정
    const setupCanvas = () => {
      canvas.style.touchAction = "none";
      canvas.style.userSelect = "none";
      canvas.style.WebkitUserSelect = "none";
      canvas.style.WebkitTouchCallout = "none";
      canvas.style.WebkitTapHighlightColor = "transparent";
      canvas.style.pointerEvents = "auto";
      canvas.style.cursor = "crosshair";
    };

    setupCanvas();

    // 좌표 가져오기 함수
    const getCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX, clientY;

      if (e.touches && e.touches.length > 0) {
        // 터치 이벤트
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        // changedTouches (touchend 이벤트)
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        // 마우스 이벤트
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      return { x, y };
    };

    // 통합 이벤트 핸들러
    const handleStart = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("서명 시작:", e.type);

      try {
        const { x, y } = getCoordinates(e);
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(x, y);
        console.log("좌표:", x, y);
      } catch (error) {
        console.error("시작 오류:", error);
      }
    };

    const handleMove = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isDrawing) return;

      try {
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
      } catch (error) {
        console.error("이동 오류:", error);
      }
    };

    const handleEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDrawing(false);
      console.log("서명 종료:", e.type);
    };

    // 이벤트 리스너 추가
    const events = [
      { type: "mousedown", handler: handleStart },
      { type: "mousemove", handler: handleMove },
      { type: "mouseup", handler: handleEnd },
      { type: "mouseleave", handler: handleEnd },
      { type: "touchstart", handler: handleStart },
      { type: "touchmove", handler: handleMove },
      { type: "touchend", handler: handleEnd },
      { type: "touchcancel", handler: handleEnd },
    ];

    events.forEach(({ type, handler }) => {
      canvas.addEventListener(type, handler, { passive: false });
    });

    return () => {
      events.forEach(({ type, handler }) => {
        canvas.removeEventListener(type, handler);
      });
    };
  }, [isDrawing]);

  // 기존 이벤트 핸들러들은 useEffect에서 통합 처리됨

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    onSave(dataURL);
  };

  // 터치 이벤트 핸들러들은 useEffect에서 통합 처리됨

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{fieldLabel}</h3>
          <button className={styles.closeButton} onClick={onCancel}>
            ✕
          </button>
        </div>

        <div
          className={styles.canvasContainer}
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className={styles.canvas}
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "transparent",
              width: "100%",
              height: "300px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "white",
              display: "block",
              position: "relative",
              zIndex: 1,
              cursor: "crosshair",
            }}
          />
        </div>

        <div className={styles.instructions}>
          <p>위 영역에 {fieldLabel}을 작성해주세요</p>
        </div>

        <div className={styles.buttons}>
          <button className={styles.clearButton} onClick={clearSignature}>
            지우기
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            취소
          </button>
          <button
            className={styles.saveButton}
            onClick={saveSignature}
            disabled={!hasSignature}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div`
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);
  min-width: 300px;
  max-width: 400px;
  animation: ${(props) => (props.isVisible ? slideIn : slideOut)} 0.3s
    ease-in-out;
  transform: ${(props) =>
    props.isVisible ? "translateX(0)" : "translateX(100%)"};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  transition: all 0.3s ease-in-out;
  border-left: 4px solid #2e7d32;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4caf50, #45a049, #4caf50);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const Icon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  width: ${(props) => props.progress}%;
  transition: width 0.1s linear;
`;

// Toast Manager
let toastId = 0;
const toasts = new Map();

// 전역 토스트 음소거 플래그
let TOAST_MUTED = false;
export const muteToasts = (muted) => {
  TOAST_MUTED = !!muted;
};

export const showToast = (title, message, duration = 4000) => {
  if (TOAST_MUTED) return -1;
  const id = ++toastId;
  const toast = {
    id,
    title,
    message,
    duration,
    isVisible: true,
  };

  toasts.set(id, toast);

  // Auto remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);

  return id;
};

export const removeToast = (id) => {
  const toast = toasts.get(id);
  if (toast) {
    toast.isVisible = false;
    setTimeout(() => {
      toasts.delete(id);
    }, 300); // Wait for animation to complete
  }
};

const ToastManager = () => {
  const [toastList, setToastList] = useState([]);

  useEffect(() => {
    const updateToasts = () => {
      setToastList(Array.from(toasts.values()));
    };

    // Update every 100ms to handle progress bars
    const interval = setInterval(updateToasts, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <ToastContainer>
      {toastList.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </ToastContainer>
  );
};

const ToastItem = ({ toast }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, toast.duration - elapsed);
      setProgress((remaining / toast.duration) * 100);
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <Toast isVisible={toast.isVisible}>
      <CloseButton onClick={() => removeToast(toast.id)}>×</CloseButton>
      <ToastHeader>
        <Icon>✓</Icon>
        <Title>{toast.title}</Title>
      </ToastHeader>
      <Message>{toast.message}</Message>
      <ProgressBar progress={progress} />
    </Toast>
  );
};

export default ToastManager;

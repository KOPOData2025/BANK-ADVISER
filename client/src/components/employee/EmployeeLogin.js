import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { getApiUrl } from "../../config/api";

const ErrorMessage = styled.div`
  background: var(--hana-error-light);
  border: 2px solid var(--hana-error);
  color: var(--hana-error);
  padding: var(--hana-space-4);
  border-radius: var(--hana-radius-md);
  margin-bottom: var(--hana-space-4);
  font-size: var(--hana-font-size-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);

  &::before {
    content: "⚠️";
    font-size: var(--hana-font-size-lg);
  }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* 전체 화면 높이 사용 */
  padding: var(--hana-space-8);
  background: linear-gradient(
    135deg,
    var(--hana-bg-gray),
    var(--hana-primary-light)
  );
  font-family: var(--hana-font-family);

  /* 태블릿에서는 추가 패딩 조정 */
  @media (min-width: 768px) {
    min-height: 100vh;
    padding: var(--hana-space-6);
  }

  /* 모바일에서는 기존 설정 유지 */
  @media (max-width: 767px) {
    min-height: calc(100vh - 120px);
    padding: var(--hana-space-8);
  }
`;

const LoginCard = styled.div`
  background: var(--hana-white);
  border-radius: var(--hana-radius-xl);
  box-shadow: var(--hana-shadow-heavy);
  padding: var(--hana-space-12);
  width: 100%;
  max-width: 480px;
  text-align: center;
  border: var(--hana-border-light);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      var(--hana-primary),
      var(--hana-mint),
      var(--hana-orange)
    );
  }
`;

const HanaLogoSection = styled.div`
  margin-bottom: var(--hana-space-8);

  .logo-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--hana-primary), var(--hana-mint));
    border-radius: var(--hana-radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--hana-font-size-4xl);
    font-weight: 900;
    color: var(--hana-white);
    margin: 0 auto var(--hana-space-4);
    box-shadow: var(--hana-shadow-medium);
  }

  .logo-text {
    font-size: var(--hana-font-size-lg);
    font-weight: 700;
    color: var(--hana-primary);
    margin-bottom: var(--hana-space-1);
  }

  .logo-subtitle {
    font-size: var(--hana-font-size-sm);
    color: var(--hana-gray);
    font-weight: 500;
  }
`;

const LoginTitle = styled.h2`
  color: var(--hana-primary);
  margin-bottom: var(--hana-space-2);
  font-size: var(--hana-font-size-3xl);
  font-weight: 900;
`;

const LoginSubtitle = styled.p`
  color: var(--hana-gray);
  margin-bottom: var(--hana-space-8);
  font-size: var(--hana-font-size-base);
  font-weight: 500;
`;

const FormGroup = styled.div`
  margin-bottom: var(--hana-space-6);
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--hana-space-2);
  font-weight: 700;
  color: var(--hana-primary);
  font-size: var(--hana-font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  width: 100%;
  padding: var(--hana-space-4);
  border: 2px solid var(--hana-light-gray);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-base);
  font-family: var(--hana-font-family);
  transition: all var(--hana-transition-base);
  background: var(--hana-white);
  
  &:focus {
    outline: none;
    border-color: var(--hana-primary);
    box-shadow: 0 0 0 3px rgba(0, 133, 122, 0.1);
    background: var(--hana-primary-light);
  }
  
  &::placeholder {
    color: var(--hana-gray);
    font-weight: 500;
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px 24px;
  background: #1e3c72;
  color: white;
  border: 1px solid #1e3c72;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(30, 60, 114, 0.2);

  &:hover {
    background: #2a5298;
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmployeeLogin = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId.trim()) {
      setError("직원 ID를 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "https://jhfjigeuxrxxbbsoflcd.supabase.co/functions/v1/login-api",
        {
          employeeId: employeeId.trim(),
          password: password.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ",
          },
        }
      );

      if (response.data.success) {
        // 로그인 성공 시 직원 정보와 세션 ID를 localStorage에 저장
        localStorage.setItem(
          "employee",
          JSON.stringify(response.data.employee)
        );
        localStorage.setItem("sessionId", response.data.sessionId);

        if (process.env.NODE_ENV === "development") {
          console.log("로그인 성공, 세션 ID:", response.data.sessionId);
        }
        navigate("/employee/dashboard");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("로그인 오류:", error);
      }
      if (error.response && error.response.status === 404) {
        setError("존재하지 않는 직원 ID입니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <HanaLogoSection>
          <div className="logo-icon">하</div>
          <div className="logo-text">하나금융그룹</div>
          <div className="logo-subtitle">Hana Financial Group</div>
        </HanaLogoSection>

        <LoginTitle>직원 로그인</LoginTitle>
        <LoginSubtitle>지능형 금융 컨설팅 시스템</LoginSubtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="employeeId">👤 직원 ID</Label>
            <Input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="직원 ID를 입력하세요 (예: 1234, admin)"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">🔒 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </FormGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? "🔄 로그인 중..." : "🚪 로그인"}
          </LoginButton>
        </form>
      </LoginCard>
    </LoginContainer>
  );
};

export default EmployeeLogin;

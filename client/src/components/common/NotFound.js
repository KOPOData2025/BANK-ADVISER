import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 8rem;
  margin-bottom: 2rem;
  opacity: 0.5;
`;

const ErrorTitle = styled.h1`
  font-size: 3rem;
  color: var(--hana-mint);
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: var(--hana-dark-gray);
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const HomeButton = styled(Link)`
  display: inline-block;
  padding: 1rem 2rem;
  background: var(--hana-mint);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--hana-mint-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.3);
  }
`;

const NotFound = () => {
  return (
    <NotFoundContainer>
      <ErrorIcon>🔍</ErrorIcon>
      <ErrorTitle>404</ErrorTitle>
      <ErrorMessage>
        죄송합니다. 요청하신 페이지를 찾을 수 없습니다.<br />
        URL을 확인하거나 메인 페이지로 돌아가세요.
      </ErrorMessage>
      <HomeButton to="/">
        메인 페이지로 돌아가기
      </HomeButton>
    </NotFoundContainer>
  );
};

export default NotFound; 
import React from 'react';
import styled from 'styled-components';

const CustomerCard = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: ${props => props.detailed ? '2rem' : '1rem'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const CustomerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
`;

const CustomerAvatar = styled.div`
  width: ${props => props.detailed ? '80px' : '60px'};
  height: ${props => props.detailed ? '80px' : '60px'};
  border-radius: 50%;
  background: linear-gradient(135deg, var(--hana-mint-light) 0%, var(--hana-mint) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.detailed ? '2rem' : '1.5rem'};
  font-weight: bold;
`;

const CustomerName = styled.h3`
  color: var(--hana-black);
  margin-bottom: 0.25rem;
  font-size: ${props => props.detailed ? '1.5rem' : '1.1rem'};
`;

const CustomerDetails = styled.div`
  color: var(--hana-dark-gray);
  font-size: 0.9rem;
  line-height: 1.4;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.detailed ? 'repeat(2, 1fr)' : '1fr'};
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  padding: 1rem;
  background: var(--hana-gray);
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: var(--hana-dark-gray);
  margin-bottom: 0.25rem;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: var(--hana-black);
  font-weight: 600;
`;

const ProductList = styled.div`
  margin-top: 1rem;
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--hana-white);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const ProductName = styled.div`
  font-weight: 500;
  color: var(--hana-black);
`;

const ProductBalance = styled.div`
  font-size: 0.9rem;
  color: var(--hana-mint);
  font-weight: 600;
`;

const SectionTitle = styled.h4`
  color: var(--hana-mint);
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '📊';
  }
`;

const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(Math.abs(amount)) + '원';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

const getGenderText = (gender) => {
  return gender === 'M' ? '남성' : gender === 'F' ? '여성' : '-';
};

const CustomerInfo = ({ customer, products = [], detailed = false }) => {
  if (!customer) {
    return (
      <CustomerCard>
        <div style={{ textAlign: 'center', color: 'var(--hana-dark-gray)' }}>
          고객 정보가 없습니다.
        </div>
      </CustomerCard>
    );
  }

  return (
    <CustomerCard detailed={detailed}>
      <CustomerHeader>
        <CustomerAvatar detailed={detailed}>
          {customer.Name ? customer.Name.charAt(0) : '?'}
        </CustomerAvatar>
        <div>
          <CustomerName detailed={detailed}>{customer.Name}</CustomerName>
          <CustomerDetails>
            <div>생년월일: {formatDate(customer.DateOfBirth)}</div>
            <div>성별: {getGenderText(customer.Gender)}</div>
            {detailed && (
              <>
                <div>연락처: {customer.PhoneNumber || '-'}</div>
                <div>이메일: {customer.Email || '-'}</div>
              </>
            )}
          </CustomerDetails>
        </div>
      </CustomerHeader>

      {detailed && (
        <>
          <InfoGrid detailed>
            <InfoItem>
              <InfoLabel>고객 ID</InfoLabel>
              <InfoValue>{customer.CustomerID}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>가입일</InfoLabel>
              <InfoValue>{formatDate(customer.RegistrationDate)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>주소</InfoLabel>
              <InfoValue>{customer.Address || '-'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>최근 평가일</InfoLabel>
              <InfoValue>{formatDate(customer.LastEvaluatedDate)}</InfoValue>
            </InfoItem>
          </InfoGrid>

          {products && products.length > 0 && (
            <div>
              <SectionTitle>보유 상품</SectionTitle>
              <ProductList>
                {products.map((product, index) => (
                  <ProductItem key={index}>
                    <div>
                      <ProductName>{product.ProductName}</ProductName>
                      <div style={{ fontSize: '0.8rem', color: 'var(--hana-dark-gray)' }}>
                        {product.ProductType} • 가입일: {formatDate(product.EnrollmentDate)}
                      </div>
                    </div>
                    <ProductBalance>
                      {product.CurrentBalance < 0 ? '-' : ''}{formatCurrency(product.CurrentBalance)}
                    </ProductBalance>
                  </ProductItem>
                ))}
              </ProductList>
            </div>
          )}
        </>
      )}
    </CustomerCard>
  );
};

export default CustomerInfo; 
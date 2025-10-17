import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode-generator';

const QRContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
`;

const QRTitle = styled.h3`
  color: var(--hana-primary);
  margin-bottom: 15px;
  font-size: 18px;
`;

const QRCodeDiv = styled.div`
  display: inline-block;
  padding: 15px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const SessionInfo = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
`;

const SessionId = styled.code`
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  color: var(--hana-primary);
`;

const Instructions = styled.p`
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  line-height: 1.5;
`;

const SessionQRCode = ({ sessionId, employeeName }) => {
  const qrRef = useRef(null);

  useEffect(() => {
    if (sessionId && qrRef.current) {
      // QR 코드 생성 (세션 ID만 포함하여 간단하게)
      const qrCodeData = sessionId;
      
      // QR 코드 생성
      const qr = QRCode(0, 'M');
      qr.addData(qrCodeData);
      qr.make();

      // QR 코드를 HTML로 변환하여 삽입
      qrRef.current.innerHTML = qr.createImgTag(4, 8);
    }
  }, [sessionId, employeeName]);

  if (!sessionId) {
    return null;
  }

  return (
    <QRContainer>
      <QRTitle>🔗 태블릿 연결</QRTitle>
      
      <QRCodeDiv ref={qrRef}>
        {/* QR 코드가 여기에 생성됩니다 */}
      </QRCodeDiv>
      
      <SessionInfo>
        <div>
          <strong>세션 ID:</strong> <SessionId>{sessionId}</SessionId>
        </div>
        <div style={{ marginTop: '8px' }}>
          <strong>담당 행원:</strong> {employeeName}
        </div>
      </SessionInfo>
      
      <Instructions>
        <strong>🔗 연결 방법:</strong><br/>
        1. 태블릿 앱에서 위 QR 코드를 스캔하거나<br/>
        2. 세션 ID를 직접 입력하여 연결하세요<br/>
        <br/>
        <strong>📱 태블릿 앱 실행 후:</strong><br/>
        • "행원 ID 또는 세션 ID" 입력란에 위 세션 ID 입력<br/>
        • 또는 카메라로 QR 코드 스캔
      </Instructions>
    </QRContainer>
  );
};

export default SessionQRCode;

import React, { useState, useEffect } from "react";
import styled from "styled-components";

const DemoContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1000;
  min-width: 500px;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
`;

const DemoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DemoTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
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

  &:hover {
    background: #ff3742;
    transform: scale(1.1);
  }
`;

const ClassificationMethod = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const MethodTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
`;

const MethodDescription = styled.p`
  margin: 0 0 10px 0;
  color: #6c757d;
  font-size: 12px;
  line-height: 1.4;
`;

const ScoreBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const ScoreLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
  color: #495057;
`;

const ScoreBarContainer = styled.div`
  flex: 1;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
`;

const ScoreBarFill = styled.div`
  height: 100%;
  background: ${(props) => (props.isEmployee ? "#2196f3" : "#4caf50")};
  width: ${(props) => props.percentage}%;
  transition: width 0.3s ease;
  border-radius: 10px;
`;

const ScoreValue = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #495057;
  min-width: 40px;
  text-align: right;
`;

const TestInput = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 15px;
`;

const TestButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

const ResultContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background: ${(props) => (props.isEmployee ? "#e3f2fd" : "#e8f5e8")};
  border: 1px solid ${(props) => (props.isEmployee ? "#2196f3" : "#4caf50")};
`;

const ResultTitle = styled.h4`
  margin: 0 0 10px 0;
  color: ${(props) => (props.isEmployee ? "#1976d2" : "#388e3c")};
  font-size: 16px;
  font-weight: 600;
`;

const ResultDetails = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.4;
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
`;

const KeywordTag = styled.span`
  background: ${(props) => (props.isEmployee ? "#2196f3" : "#4caf50")};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
`;

const SpeakerClassificationDemo = ({ onClose }) => {
  const [testText, setTestText] = useState("");
  const [classificationResult, setClassificationResult] = useState(null);

  // 화자 분류 시뮬레이션
  const classifySpeaker = (text) => {
    // 행원 키워드
    const employeeKeywords = [
      "안녕하세요",
      "어떻게 도와드릴까요",
      "상품",
      "이자율",
      "가입",
      "신청",
      "서류",
      "필요",
      "도움",
      "상담",
      "추천",
      "조건",
      "혜택",
      "적금",
      "예금",
      "대출",
      "보험",
      "계약",
      "약관",
      "드리겠습니다",
      "해드리겠습니다",
      "도와드리겠습니다",
      "안내드리겠습니다",
    ];

    // 고객 키워드
    const customerKeywords = [
      "궁금",
      "알고 싶",
      "어떻게",
      "언제",
      "얼마",
      "비용",
      "수수료",
      "언제까지",
      "언제부터",
      "언제나",
      "언제든",
      "언제든지",
      "좋",
      "나쁘",
      "괜찮",
      "괜찮나",
      "괜찮은지",
      "괜찮을까",
      "생각",
      "고민",
      "고민중",
      "생각중",
      "고민해",
      "생각해",
    ];

    // 키워드 매칭
    const employeeMatches = employeeKeywords.filter((keyword) =>
      text.includes(keyword)
    );
    const customerMatches = customerKeywords.filter((keyword) =>
      text.includes(keyword)
    );

    // 점수 계산
    const employeeScore = employeeMatches.length;
    const customerScore = customerMatches.length;
    const totalScore = employeeScore + customerScore;

    // 결과 결정
    const isEmployee = employeeScore > customerScore;
    const confidence =
      totalScore > 0
        ? Math.max(employeeScore, customerScore) / totalScore
        : 0.5;

    return {
      isEmployee,
      confidence,
      employeeScore,
      customerScore,
      employeeMatches,
      customerMatches,
      totalScore,
    };
  };

  const handleTest = () => {
    if (!testText.trim()) return;

    const result = classifySpeaker(testText);
    setClassificationResult(result);
  };

  const demoTexts = [
    "안녕하세요, 어떤 상품에 대해 궁금하신가요?",
    "적금 상품의 이자율이 얼마나 되나요?",
    "가입하려면 어떤 서류가 필요하죠?",
    "언제까지 가입할 수 있나요?",
    "수수료는 얼마나 되나요?",
    "괜찮은 상품인 것 같은데 고민이에요",
  ];

  return (
    <DemoContainer>
      <DemoHeader>
        <DemoTitle>🎤 화자 분리 분석 데모</DemoTitle>
        {onClose && (
          <CloseButton onClick={onClose} title="닫기">
            ×
          </CloseButton>
        )}
      </DemoHeader>

      {/* Pyannote.audio 방식 */}
      <ClassificationMethod>
        <MethodTitle>1. 🤖 Pyannote.audio AI 분석</MethodTitle>
        <MethodDescription>
          음성의 음성학적 특성(음높이, 음색, 리듬)을 분석하여 화자를 자동으로
          구분합니다.
        </MethodDescription>
        <ScoreBar>
          <ScoreLabel>행원</ScoreLabel>
          <ScoreBarContainer>
            <ScoreBarFill isEmployee={true} percentage={75} />
          </ScoreBarContainer>
          <ScoreValue>75%</ScoreValue>
        </ScoreBar>
        <ScoreBar>
          <ScoreLabel>고객</ScoreLabel>
          <ScoreBarContainer>
            <ScoreBarFill isEmployee={false} percentage={25} />
          </ScoreBarContainer>
          <ScoreValue>25%</ScoreValue>
        </ScoreBar>
      </ClassificationMethod>

      {/* 텍스트 내용 분석 */}
      <ClassificationMethod>
        <MethodTitle>2. 📝 텍스트 내용 분석</MethodTitle>
        <MethodDescription>
          발화 내용의 키워드와 표현 패턴을 분석하여 화자를 구분합니다.
        </MethodDescription>
        <TestInput
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="테스트할 텍스트를 입력하세요..."
        />
        <TestButton onClick={handleTest}>분석하기</TestButton>

        {/* 데모 텍스트 버튼들 */}
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
          }}
        >
          {demoTexts.map((text, index) => (
            <button
              key={index}
              onClick={() => setTestText(text)}
              style={{
                background: "#f8f9fa",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              예시 {index + 1}
            </button>
          ))}
        </div>
      </ClassificationMethod>

      {/* 음성 패턴 분석 */}
      <ClassificationMethod>
        <MethodTitle>3. 🎵 음성 패턴 분석</MethodTitle>
        <MethodDescription>
          발화 시간, 빈도, 리듬 등을 분석하여 화자를 구분합니다.
        </MethodDescription>
        <ScoreBar>
          <ScoreLabel>발화 시간</ScoreLabel>
          <ScoreBarContainer>
            <ScoreBarFill isEmployee={true} percentage={80} />
          </ScoreBarContainer>
          <ScoreValue>긴 발화</ScoreValue>
        </ScoreBar>
        <ScoreBar>
          <ScoreLabel>발화 빈도</ScoreLabel>
          <ScoreBarContainer>
            <ScoreBarFill isEmployee={false} percentage={60} />
          </ScoreBarContainer>
          <ScoreValue>높은 빈도</ScoreValue>
        </ScoreBar>
      </ClassificationMethod>

      {/* 결과 표시 */}
      {classificationResult && (
        <ResultContainer isEmployee={classificationResult.isEmployee}>
          <ResultTitle isEmployee={classificationResult.isEmployee}>
            {classificationResult.isEmployee ? "👨‍💼 행원" : "👤 고객"}으로 분류됨
          </ResultTitle>
          <ResultDetails>
            <div>
              신뢰도: {(classificationResult.confidence * 100).toFixed(1)}%
            </div>
            <div>행원 점수: {classificationResult.employeeScore}</div>
            <div>고객 점수: {classificationResult.customerScore}</div>
            <div>총 키워드: {classificationResult.totalScore}개</div>
          </ResultDetails>

          {classificationResult.employeeMatches.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}
              >
                행원 키워드:
              </div>
              <KeywordList>
                {classificationResult.employeeMatches.map((keyword, index) => (
                  <KeywordTag key={index} isEmployee={true}>
                    {keyword}
                  </KeywordTag>
                ))}
              </KeywordList>
            </div>
          )}

          {classificationResult.customerMatches.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}
              >
                고객 키워드:
              </div>
              <KeywordList>
                {classificationResult.customerMatches.map((keyword, index) => (
                  <KeywordTag key={index} isEmployee={false}>
                    {keyword}
                  </KeywordTag>
                ))}
              </KeywordList>
            </div>
          )}
        </ResultContainer>
      )}

      {/* 종합 분석 */}
      <ClassificationMethod>
        <MethodTitle>4. 🎯 종합 분석 결과</MethodTitle>
        <MethodDescription>
          위의 모든 분석을 종합하여 최종 화자를 결정합니다.
        </MethodDescription>
        <ScoreBar>
          <ScoreLabel>최종 결과</ScoreLabel>
          <ScoreBarContainer>
            <ScoreBarFill isEmployee={true} percentage={70} />
          </ScoreBarContainer>
          <ScoreValue>행원 70%</ScoreValue>
        </ScoreBar>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "5px" }}>
          가중치: AI 분석 40% + 텍스트 분석 40% + 패턴 분석 20%
        </div>
      </ClassificationMethod>
    </DemoContainer>
  );
};

export default SpeakerClassificationDemo;

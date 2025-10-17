# 뱅크 어드바이저

![Spring](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![AWS](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 1. 프로젝트 개요
<img width="1440" height="900" alt="프로젝트 개요" src="https://github.com/user-attachments/assets/6248a48b-7457-4903-8986-0d091c899e0a" />

AI 기반 스마트 금융 상담 시스템 'Bank Advisor'는 행원의 업무 효율을 극대화하고, 고객에게는 초개인화된 상담 경험을 제공하는 통합 플랫폼입니다.

---

## 2. 기획배경
<p align="center">
  <img width="49%" alt="설문조사 결과" src="https://github.com/user-attachments/assets/1d58784c-fb22-4071-9a56-6e104199bf3f" />
  <img width="49%" alt="행원의 어려움" src="https://github.com/user-attachments/assets/cd91c510-7e6f-4a9a-bfc4-8f5ccecefe8f" />
</p>

"좋은 상품을 추천해도 영업으로 오해받는다"는 행원의 심리적 부담감에서 시작했습니다. 그 원인인 **정보의 홍수, 반복적인 업무, 소통의 한계**를 기술로 해결하고자 했습니다.

---

## 3. 서비스 소개
<img width="1440" height="900" alt="서비스 소개" src="https://github.com/user-attachments/assets/c91970eb-c0ac-4ad1-8f27-dded05d0708e" />

기존의 스마트 태블릿이 가진 '단순 서식 작성'이라는 수동적인 역할을, AI 추천과 실시간 시뮬레이션이 가능한 **적극적인 상담 도구**로 재정의하여 상담의 패러다임을 전환합니다.

---

## 4. 서비스 기능
<img width="1440" height="900" alt="서비스 기능" src="https://github.com/user-attachments/assets/611e69e4-bb19-4c56-95c2-2e28db2828fc" />

### 4-1. 대시보드
- **포트폴리오 분석:** 고객 자산 현황, 투자 성향 등 시각화 분석
- **AI 상품 추천:** RAG 알고리즘을 활용한 상담 내용 기반 최적 상품 제안
- **실시간 음성인식:** STT/화자분리 기술을 적용한 상담 내용 자동 기록

### 4-2. 고객 이력
- **이력 조회:** 과거 거래 및 상담 이력 데이터 조회
- **PDF 뷰어:** 관련 서류 및 문서 확인 기능

### 4-3. 상품
- **정보 시각화:** 복잡한 상품 정보를 그래프, 차트 등으로 시각화
- **What-if 시뮬레이션:** 우대 조건 변경 등에 따른 예상 수익 실시간 계산
- **상품 비교:** 여러 상품의 장단점을 한 화면에서 직관적으로 비교
- **스마트 서식:** 상담 내용 기반 서식 자동 생성 및 전자 서명 기능
---

## 5. 특화 기술

### 5-1. 상품 추천 파이프라인
<img width="1440" height="900" alt="상품 추천 파이프라인" src="https://github.com/user-attachments/assets/36d540df-7033-49b7-abdc-d42369e9c99a" />

단순 키워드 매칭을 넘어, 데이터 수집부터 고객 컨텍스트 분석, RAG 기반 후보군 생성까지 총 **6단계의 정교한 파이프라인**을 통해 가장 신뢰도 높은 추천 결과를 제공합니다.

### 5-2. OCR 로그인
<img width="1440" height="900" alt="OCR 로그인" src="https://github.com/user-attachments/assets/1aa597af-b7c6-4d63-9751-d4e0ab2ce69a" />

실제 창구 환경에서 발생할 수 있는 빛 반사, 기울어짐 등 까다로운 예외 상황(Edge Case)에 대한 테스트를 완료하여, 어떤 조건에서도 빠르고 정확하게 고객을 인식하는 **강건한 기술**을 확보했습니다.

### 5-3. Pyannote 화자분리
<img width="1440" height="900" alt="Pyannote 화자분리" src="https://github.com/user-attachments/assets/0ff709b2-2f68-4a8a-b184-bc26118be19d" />

오픈소스 모델을 그대로 사용하지 않았습니다. 1,000시간 분량의 **[AI Hub 금융 분야 음성 데이터](https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&dataSetSn=100)** 추가 학습과 행원별 음성 프로필 적용을 통해 행원 식별 정확도 **99**%를 달성하였습니다.

---

## 6. 시스템 아키텍처
<img width="1440" height="900" alt="시스템 아키텍처" src="https://github.com/user-attachments/assets/886e6817-d04b-453a-9a4e-4eac645270b5" />

---
<div align="right">

[목차로](#목차)

</div>

## 개발자 프로필

| 구분       | 내용                                                                                         | 비고                                                                                                      |
|:--:|:--:|:--:|
| 이름       | 김승현                                                                                       |  <img src="https://github.com/user-attachments/assets/e6d05f5a-10dd-4e1c-98d3-1f185e812b8d" alt="김승현_증명사진" width="150">|
| 연락처     | 이메일                                                                                       | ppdoli123@naver.com                                                                                       |
| 전공       | 광운대학교 정보융합학부                                                                       | 졸업(2025.08)                                                                                |
| 이력       | (주)뱅가드랩                                                                       | 인턴(2024.01.02~2024.02.28)                                                                               |
| Skill set | Language                                                                                     | Python, Java, Javascript   |
|           | Framework & Library                                                                          | Pandas, Spring, React |
|           | Database                                                                                     | MySQL, Oracle, postgreSQL                              |
|           | Etc                                                                                          | Git, AWS, Docker, Figma|
| 자격증    | adsp (데이터 분석 준전문가)                             | 2022.03.25 |
|           | 빅데이터 분석기사                      | 2023.07.14 |
|           | SQLD (sql 개발자)                            | 2024.04.05 |
|           | 정보처리기사                      | 2024.06.18 |
| 수상      | 2025학년도 폴리텍 벤처창업경진대회 본선진출(동상 확보)                                                                       | 한국폴리텍대학 (2025.10.22)    |
|          | 2025학년도 광명융합기술교육원 경진대회 은상                                                                                | 한국폴리텍대학 (2025.10.15)    |
|          | 2023학년도 광운대학교 캡스톤 대회 장려상                                                                                | 광운대학교 (2023.11.21)    |
| 교육      | 하나금융티아이 채용연계형 교육  <br/>(한국폴리텍대학교 광명융합기술교육원 - 데이터분석과) | 2025.03 ~ 2025.10         |



---

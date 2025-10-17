FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 설치 (최소한)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY voice_profile_server.py .
COPY voice_feature_cache.py .
COPY supabase_voice_profile_manager.py .
COPY voice_processor.py .
COPY text_classifier.py .

# 포트 노출
EXPOSE 5005

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5005/health || exit 1

# 서버 실행
CMD ["python", "voice_profile_server.py"]
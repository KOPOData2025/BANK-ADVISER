# Multi-stage build for React application
FROM node:18-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함 - 빌드에 필요)
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 경량화된 Nginx 이미지 사용
FROM nginx:alpine

# 불필요한 파일 제거
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /etc/nginx/conf.d/default.conf

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 파일을 Nginx 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html

# 보안을 위한 권한 설정 (nginx 사용자는 이미 존재)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

USER nginx

# 포트 노출
EXPOSE 80

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]

FROM openjdk:11-jdk-slim

WORKDIR /app

# 시스템 패키지 업데이트
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Maven wrapper와 pom.xml 복사
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

# 소스 코드 복사
COPY src src

# Maven 빌드 실행
RUN ./mvnw clean package -DskipTests

# JAR 파일을 app.jar로 복사
RUN cp target/simple-backend-0.0.1-SNAPSHOT.jar app.jar

# 포트 노출
EXPOSE 8080

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 애플리케이션 실행
CMD ["java", "-jar", "app.jar"]
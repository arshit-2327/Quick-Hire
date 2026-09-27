# Stage 1: Build application with Maven and Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Maven descriptor and source code
COPY pom.xml .
COPY src ./src

# Build production jar skipping test phase
RUN mvn clean package -DskipTests

# Stage 2: Minimal Java 21 JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-privileged user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy compiled artifact from build stage
COPY --from=build /app/target/quick-hire-backend-*.jar app.jar

# Default Spring Boot port
EXPOSE 8080

# Optimized container JVM flags
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

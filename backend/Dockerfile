# Stage 1: Build the application 
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .

# DOWNLOAD DEPENDENCIES (caches them for future builds)
RUN mvn dependency:go-offline
COPY src ./src
# BUILD THE JAR FILE 
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# COPY THE JAR FROM THE BUILD STAGE
COPY --from=build /app/target/*.jar app.jar

# EXPOSE THE PORT SPRING BOOT APP RUNS ON
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
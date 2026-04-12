# Stage 1: Build the application 
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Changed to match exactly what worked on your local machine
RUN npm run build

# STAGE 2: Serve the application with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80
# Stage 1: Build React/Vite app
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
# Bỏ qua lỗi nếu chưa có thư mục mã nguồn
COPY package*.json ./
RUN npm install

# Copy mã nguồn và build
COPY . .

# Nhận build argument từ docker-compose và dùng để build Vite
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Tạo thư mục dist tạm thời nếu chưa có mã nguồn (giúp Nginx stage không bị lỗi)
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine

# Copy cấu hình Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files từ stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM python:3.12-slim

# Cài đặt các thư viện hệ thống cần thiết và Docker CLI (Dành cho Worker chạy Sandbox)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Khởi tạo thư mục và copy requirements
COPY requirements.txt .

# Cài đặt Python dependencies
# Sử dụng --no-cache-dir để giảm dung lượng image
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn Backend vào container
COPY . /app

# Biến môi trường mặc định (Có thể ghi đè trong docker-compose)
ENV PYTHONPATH=/app
ENV APP_ENV=production

# Expose port cho FastAPI (Chỉ có tác dụng với container chạy Web server)
EXPOSE 8000

# Lệnh khởi động mặc định (Sẽ bị override nếu dùng cho Worker)
CMD ["uvicorn", "app.entrypoints.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

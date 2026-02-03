# Stage 1: Build the React application
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the Go exporter
FROM golang:1.22-alpine AS go-builder
RUN apk add --no-cache git
WORKDIR /app
COPY backend/ .
# Check if the submodule files are actually there. If not, clone them.
RUN if [ ! -f "yazio-exporter/go.mod" ]; then \
    echo "Submodule files missing, cloning from source..." && \
    rm -rf yazio-exporter && \
    git clone https://github.com/funmelon64/Yazio-Exporter.git yazio-exporter; \
    fi
WORKDIR /app/yazio-exporter
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/YazioExport -v .

# Stage 3: Final Python environment
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ .

# Copy the built Go binary
COPY --from=go-builder /app/YazioExport ./yazio-exporter/

# Copy the frontend static files
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose the single port
EXPOSE 5172

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5172"]

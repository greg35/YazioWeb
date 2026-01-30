# Stage 1: Build the Go exporter
FROM golang:1.22-alpine AS builder

# Install git to clone if needed
RUN apk add --no-cache git

WORKDIR /app

# Clone if the directory is empty (happens with remote build context without submodules)
RUN if [ ! -d "yazio-exporter" ] || [ ! -f "yazio-exporter/go.mod" ]; then \
    git clone https://github.com/funmelon64/Yazio-Exporter.git yazio-exporter; \
    fi

WORKDIR /app/yazio-exporter

# Copy go.mod and go.sum and download dependencies
# (This still works if files are present, but now we have a fallback)
COPY yazio-exporter/go.mod yazio-exporter/go.sum ./
RUN go mod download

# Copy the rest of the exporter source code
COPY yazio-exporter/ ./

# Build the exporter
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/YazioExport -v .

# Stage 2: Create the Python environment
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY main.py .

# Copy the built Go binary from the builder stage
COPY --from=builder /app/YazioExport ./yazio-exporter/

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

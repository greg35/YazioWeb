# Docker Setup

This document explains how to run the YazioWeb application using Docker and Docker Compose.

## Prerequisites

- Docker installed
- Docker Compose installed

## Running the Application

There are two ways to run the application using the provided `docker-compose.yml`.

### 1. Local Development

You can run the application directly from the source code:

```bash
docker-compose up --build
```

This uses the `Dockerfile` at the root of the project to build a single container housing both the frontend and backend.

### 2. From GitHub (Pre-built Image)

The `docker-compose.yml` is configured to build the image locally by default. To use a pre-built image from GitHub Container Registry (if available), you would need to adjust the `image` field in `docker-compose.yml`, but currently, the setup is optimized for building from source or the context provided.

If you wish to build directly from the remote repository without cloning:

```yaml
services:
  app:
    build:
      context: https://github.com/greg56/YazioWeb.git
      dockerfile: Dockerfile
    ports:
      - "5172:5172"
    volumes:
      - yazio-data:/data
    networks:
      - yazio-net
```

The application will be available at [http://localhost:5172](http://localhost:5172).

## Architecture

The project now uses a **Unified Architecture** where both the frontend and backend run in a single Docker container.

- **Dockerfile:** `./Dockerfile` (Root directory)
- **Description:** 
    1.  **Stage 1 (Frontend):** Builds the React frontend using Node.js.
    2.  **Stage 2 (Exporter):** Builds the Go exporter binary.
    3.  **Stage 3 (Final):** Sets up a Python environment, copies the backend code, the compiled Go binary, and the static frontend assets. It serves the API using FastAPI and the frontend as static files.
- **Port:** Exposed on port `5172`.

## Data Persistence

The `docker-compose.yml` defines a named volume called `yazio-data`. This volume is mounted to the `/data` directory in the container. It is used to store:
- `days.json`
- `products.json`
- `token.txt`
- `config.json`

This ensures that your data and login session are not lost when you stop or restart the containers.
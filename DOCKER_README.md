# Docker Setup

This document explains how to run the YazioWeb application using Docker and Docker Compose.

## Prerequisites

- Docker installed
- Docker Compose installed

## Running the Application

There are two ways to run the application using the provided `docker-compose.yml`.

### 1. Local Development

If you have the source code on your local machine, you need to modify the `docker-compose.yml` to use local build contexts.

Change the `build` sections for both `frontend` and `backend` services as follows:

```yaml
# In docker-compose.yml

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    # ... rest of the service config

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    # ... rest of the service config
```

Then, you can run the application with:

```bash
docker-compose up --build
```

### 2. From GitHub (for Portainer or remote deployment)

The `docker-compose.yml` is configured to build the images directly from a GitHub repository.

You need to replace the placeholder URL with your actual GitHub repository URL in the `build.context` for both services.

```yaml
# In docker-compose.yml

services:
  backend:
    build:
      # Replace with your GitHub repository URL and desired branch
      context: https://github.com/greg56/YazioWeb.git#:backend
      dockerfile: Dockerfile
    # ... rest of the service config

  frontend:
    build:
      # Replace with your GitHub repository URL and desired branch
      context: https://github.com/greg56/YazioWeb.git#:frontend
      dockerfile: Dockerfile
    # ... rest of the service config
```

Once you have updated the URL, you can deploy this `docker-compose.yml` in Portainer or run it with `docker-compose up --build`.

The frontend will be available at [http://localhost:5173](http://localhost:5173).

## Services

### Backend

- **Dockerfile:** `backend/Dockerfile`
- **Description:** A Python FastAPI application that serves the Yazio data. It uses a Go binary to scrape the data from Yazio.
- **Ports:** The backend is available at port `8000` within the Docker network.

### Frontend

- **Dockerfile:** `frontend/Dockerfile`
- **Description:** A React application that provides the user interface for visualizing the Yazio data.
- **Ports:** The frontend is exposed on port `5173`.

## Data Persistence

The `docker-compose.yml` defines a named volume called `yazio-data`. This volume is mounted to the `/data` directory in the `backend` container. It is used to store:
- `days.json`
- `products.json`
- `token.txt`

This ensures that your data is not lost when you stop or restart the containers.

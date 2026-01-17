#!/bin/sh
set -e

# The git-clone service is a workaround for the issue of git submodules in docker-compose.
# This script clones the main repository and the submodule into a shared volume.
# The backend and frontend services will then use this shared volume as their build context.
# This avoids the "fatal: No url found for submodule path 'backend/yazio-exporter' in .gitmodules" error.

# The /src directory is a shared volume between the git-clone, backend and frontend services.
if [ -d "/src/.git" ]; then
  echo "Git repository already cloned."
else
  echo "Cloning Git repository..."
  git clone https://github.com/greg56/YazioWeb.git /src
  echo "Cloning submodule..."
  git clone https://github.com/prsolucoes/yazio-exporter.git /src/backend/yazio-exporter
fi

echo "Setting permissions..."
chmod -R 777 /src

echo "Cloning complete."

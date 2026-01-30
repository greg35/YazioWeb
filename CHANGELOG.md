# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-01-30

### Changed
- Changed backend port from 8000 to 5172 to avoid port conflicts.

## [1.0.4] - 2026-01-30

### Fixed
- Fixed Docker build error "go.sum not found" by making the submodule cloning more robust in the Dockerfile.

## [1.0.3] - 2026-01-30

### Fixed
- Added `.gitmodules` file to fix Docker build errors when cloning the repository remotely.

## [1.0.2] - 2026-01-30

### Fixed
- Fixed GitHub Release creation by making the job independent in the workflow.

## [1.0.1] - 2026-01-30

### Added
- Automated GitHub Release creation in the CI/CD workflow.

## [1.0.0] - 2026-01-30

### Added
- GitHub Actions workflow for building and pushing Docker images to GitHub Packages (GHCR).
- Automatic cloning of `yazio-exporter` in `backend/Dockerfile` for remote builds.
- Support for building images directly from GitHub URL in `docker-compose.yml`.

### Changed
- Updated `docker-compose.yml` to use GitHub repository as build context.
- Improved `backend/Dockerfile` build process.

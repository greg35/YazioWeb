# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-30

### Added
- GitHub Actions workflow for building and pushing Docker images to GitHub Packages (GHCR).
- Automatic cloning of `yazio-exporter` in `backend/Dockerfile` for remote builds.
- Support for building images directly from GitHub URL in `docker-compose.yml`.

### Changed
- Updated `docker-compose.yml` to use GitHub repository as build context.
- Improved `backend/Dockerfile` build process.

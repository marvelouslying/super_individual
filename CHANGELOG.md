# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added custom timestamp logging function for Sequelize database queries
- Added CHANGELOG.md to document project changes

### Changed
- Updated Sequelize configuration to use environment variables with custom logging
- Updated database config files for development, test, and production environments
- Modified logging configuration to support timestamped SQL queries

## [1.0.0] - Initial Release

### Added
- Full-stack RealWorld example app with React/Vite frontend and Express/Sequelize backend
- User authentication with JWT
- Article CRUD operations
- Comment system
- Follow/unfollow functionality
- Favorite/unfavorite articles
- Tags system
- Test suite with Vitest

### Changed
- Migrated from Create React App to Vite for frontend
- Updated project dependencies
- Refactored environment variable handling
- Changed Vite port to 3000

### Fixed
- Fixed database request skipping when switching profiles

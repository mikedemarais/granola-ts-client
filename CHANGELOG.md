# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.1] - 2024-01-16

### Fixed
- **Critical**: Restored backwards compatibility with v0.3.0 constructor pattern `new GranolaClient('token')`
- **Critical**: Added authentication validation to prevent silent failures - API calls now throw clear errors when token is missing
- Fixed `getDocumentTranscript()` returning empty arrays when authentication fails
- Fixed `getPanelTemplates()` returning empty arrays when authentication fails

### Added
- Comprehensive backwards compatibility test suite (24 tests)
- Support for multiple constructor patterns:
  - `new GranolaClient('token')` - v0.3.0 style (restored)
  - `new GranolaClient({ apiKey: 'token' })` - v0.11.0 style
  - `new GranolaClient({ token: 'token' })` - alternative style
  - `new GranolaClient()` with `setToken()` - deferred auth
- `hasToken()` method for checking authentication state
- Warning messages when no authentication token is provided
- ClientOptions interface for type-safe constructor options

### Documentation
- Added critical library development guidelines to prevent future breaking changes
- Documented backwards compatibility contract
- Added regression prevention strategies
- Included semantic versioning requirements

## [0.11.0] - 2024-01-15

### Added
- Stable wrapper architecture with Proxy pattern for backwards compatibility
- Token extraction utilities (optional, via `granola-ts-client/utils`)
- Async generator support for pagination
- Reduced implementation size by 42% (447 → 260 lines)

### Changed
- ⚠️ **BREAKING** (unintentional): Constructor signature changed - fixed in 0.11.1

## Previous Versions

See [GitHub Releases](https://github.com/mikedemarais/granola-ts-client/releases) for older versions.
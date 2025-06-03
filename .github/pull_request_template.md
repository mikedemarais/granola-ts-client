## Description
Add transcript processing capabilities with speaker identification and advanced formatting

## Motivation and Context
This PR adds transcript processing capabilities with speaker identification, deduplication, and improved formatting. These features make transcripts more readable by identifying speakers based on audio source, removing duplicate segments, and applying dialog coherence heuristics.

## How Has This Been Tested?
- Added comprehensive unit tests covering all new functionality
- Tests verify text similarity calculation, deduplication logic, speaker assignment, and export formatting
- Verified type safety with TypeScript compiler
- Ensured 80%+ test coverage for new code

## Types of changes
- [x] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Checklist:
- [x] My code follows the code style of this project.
- [x] My change requires a change to the documentation.
- [x] I have updated the documentation accordingly.
- [x] I have added tests to cover my changes.
- [x] All new and existing tests passed.
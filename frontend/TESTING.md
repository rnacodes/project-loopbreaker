# Testing Guide

This document explains how to run the unit tests for the ProjectLoopbreaker frontend application.

## Prerequisites

Before running tests, make sure you have installed the testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

## Running Tests

### Interactive Mode (Watch Mode)
```bash
npm test
```
This will start Vitest in watch mode, automatically re-running tests when files change.

### Single Run
```bash
npm run test:run
```
This will run all tests once and exit.

### With Coverage
```bash
npm run test:coverage
```
This will run all tests and generate a coverage report.

## Test Structure

### AddMediaForm Tests (`src/components/__tests__/AddMediaForm.test.jsx`)

The AddMediaForm tests cover:

1. **Form Submission - Regular Media**
   - Tests that all form fields are properly submitted
   - Verifies that data is saved to database with correct structure
   - Tests required field validation

2. **Form Submission - Podcast Episode**
   - Tests podcast-specific fields (series ID, duration, audio link)
   - Verifies podcast episode data structure
   - Tests duration conversion from minutes to seconds

3. **Form Submission - Podcast Series**
   - Tests podcast series creation
   - Verifies regular media API call for series

4. **Mixlist Integration**
   - Tests adding media to selected mixlists
   - Verifies mixlist selection and submission

5. **Error Handling**
   - Tests API error scenarios
   - Verifies user-friendly error messages

### CreateMixlistForm Tests (`src/components/__tests__/CreateMixlistForm.test.jsx`)

The CreateMixlistForm tests cover:

1. **Form Submission**
   - Tests mixlist creation with all properties
   - Verifies data persistence to database
   - Tests name validation and trimming

2. **Thumbnail Generation**
   - Tests unique thumbnail URL generation
   - Verifies blur effect inclusion
   - Tests timestamp-based uniqueness

3. **Form State Management**
   - Tests loading states during submission
   - Verifies button disable/enable behavior

4. **Error Handling**
   - Tests API error scenarios
   - Verifies error recovery and user feedback

5. **Navigation**
   - Tests successful creation navigation
   - Verifies cancel button functionality

6. **Data Persistence**
   - Tests various name formats and lengths
   - Verifies special character handling

## Test Data Structure

### Media Item Properties Tested

The tests verify that all these properties are properly saved to the database:

- **Title**: Media item name
- **MediaType**: Type of media (Book, Podcast, Movie, etc.)
- **Status**: Current status (Uncharted, ActivelyExploring, Completed, Abandoned)
- **Topics**: Array of topics/tags
- **Genres**: Array of genres
- **Link**: URL to the media
- **Description**: Brief description
- **DateCompleted**: Completion date (when status is Completed)
- **Rating**: User rating (SuperLike, Like, Neutral, Dislike)
- **OwnershipStatus**: Ownership type (Own, Rented, Streamed)
- **Thumbnail**: Image URL
- **Notes**: User notes and thoughts

### Podcast Episode Specific Properties

- **PodcastSeriesId**: ID of the podcast series
- **AudioLink**: Direct audio file URL
- **ReleaseDate**: Episode release date
- **DurationInSeconds**: Episode duration in seconds

### Mixlist Properties Tested

- **Name**: Mixlist name
- **Thumbnail**: Generated thumbnail URL

## Mocking Strategy

The tests use comprehensive mocking to isolate component behavior:

1. **API Service Mocking**: All API calls are mocked to return predictable responses
2. **Router Mocking**: React Router navigation is mocked to test navigation behavior
3. **Browser API Mocking**: Window APIs like matchMedia, ResizeObserver are mocked
4. **Console Mocking**: Console methods can be optionally suppressed to reduce test noise

## Writing New Tests

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use descriptive test names that explain the expected behavior
3. Test both success and failure scenarios
4. Verify that all form data is properly structured before API calls
5. Test edge cases like empty inputs, special characters, and validation errors

## Troubleshooting

### Common Issues

1. **Test Environment**: Ensure jsdom is properly configured in vitest.config.js
2. **Mock Setup**: Check that all required mocks are properly configured
3. **Async Operations**: Use `waitFor` for asynchronous operations and API calls
4. **Component Rendering**: Ensure components are wrapped with necessary providers (Router, etc.)

### Debug Mode

Run tests in debug mode to see detailed output:

```bash
npm run test:run -- --reporter=verbose
```

## Coverage Goals

The tests aim for:
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%

Run coverage reports to identify untested code paths:

```bash
npm run test:coverage
```

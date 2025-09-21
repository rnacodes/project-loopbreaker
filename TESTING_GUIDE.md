# ProjectLoopbreaker Testing Guide

This comprehensive guide will help you set up, run, and troubleshoot tests for the ProjectLoopbreaker application.

## Overview

ProjectLoopbreaker uses a comprehensive testing strategy with:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions and API endpoints
- **Frontend Tests**: Test React components and user interactions

## Quick Start

### Run Tests from Root Directory

### Running All Tests
```powershell
# Run all tests (backend + frontend)
.\run-all-tests.ps1

# Run only backend tests
.\run-backend-tests.ps1

# Run only frontend tests
.\run-frontend-tests.ps1
```

### Manual Test Execution

#### Backend Tests
```powershell
# Navigate to tests directory
cd tests

# Run unit tests
dotnet test ProjectLoopbreaker.UnitTests --verbosity normal

# Run integration tests
dotnet test ProjectLoopbreaker.IntegrationTests --verbosity normal

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

#### Frontend Tests
```powershell
# Navigate to frontend directory
cd frontend

# Run tests once
npm run test:run

# Run tests in watch mode
npm test

# Run with coverage
npm run test:coverage
```

## Test Structure

### Backend Tests

#### Unit Tests (`tests/ProjectLoopbreaker.UnitTests/`)
- **Domain Tests**: Test entity behavior and business logic
- **Application Tests**: Test service layer with mocked dependencies
- **Test Data Factory**: Generate consistent test data

#### Integration Tests (`tests/ProjectLoopbreaker.IntegrationTests/`)
- **API Controller Tests**: Test HTTP endpoints end-to-end
- **Database Integration**: Test with in-memory database
- **WebApplicationFactory**: Configure test environment

### Frontend Tests (`frontend/src/components/__tests__/`)
- **Component Tests**: Test React component behavior
- **User Interaction Tests**: Test form submissions and user flows
- **API Integration Tests**: Test API calls and responses

## Test Categories

### 1. Domain Entity Tests
Test the core business logic and entity behavior:

```csharp
// Example: Testing BaseMediaItem entity
[Fact]
public void Constructor_ShouldSetDefaultValues()
{
    var mediaItem = TestDataFactory.CreateBook();
    mediaItem.Status.Should().Be(Status.Uncharted);
    mediaItem.DateAdded.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
}
```

### 2. Application Service Tests
Test business logic with mocked dependencies:

```csharp
// Example: Testing BookService
[Fact]
public async Task CreateBookAsync_ShouldCreateNewBook_WhenBookDoesNotExist()
{
    // Arrange
    var dto = TestDataFactory.CreateBookDto("Test Book", "Test Author");
    _mockContext.Setup(c => c.Books).Returns(_mockBooks.Object);
    
    // Act
    var result = await _bookService.CreateBookAsync(dto);
    
    // Assert
    result.Should().NotBeNull();
    result.Title.Should().Be(dto.Title);
}
```

### 3. API Integration Tests
Test HTTP endpoints with real database:

```csharp
// Example: Testing BookController
[Fact]
public async Task CreateBook_ShouldCreateBook_WhenValidDataProvided()
{
    var dto = TestDataFactory.CreateBookDto("Test Book", "Test Author");
    
    var response = await _client.PostAsJsonAsync("/api/book", dto);
    
    response.StatusCode.Should().Be(HttpStatusCode.Created);
    var createdBook = await response.Content.ReadFromJsonAsync<Book>();
    createdBook.Should().NotBeNull();
}
```

### 4. Frontend Component Tests
Test React components and user interactions:

```javascript
// Example: Testing AddMediaForm
test('should submit form with valid data', async () => {
  const user = userEvent.setup();
  render(<AddMediaForm />);
  
  await user.type(screen.getByLabelText(/title/i), 'Test Book');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(mockApiClient.post).toHaveBeenCalledWith('/api/media', expect.any(Object));
});
```

## Test Data Management

### TestDataFactory
The `TestDataFactory` class provides consistent test data generation:

```csharp
// Create test entities
var book = TestDataFactory.CreateBook("Test Title", "Test Author");
var podcast = TestDataFactory.CreatePodcastSeries("Test Podcast");
var mixlist = TestDataFactory.CreateMixlist("Test Mixlist");

// Create test DTOs
var bookDto = TestDataFactory.CreateBookDto("Test Title", "Test Author");
var podcastDto = TestDataFactory.CreatePodcastDto("Test Podcast", PodcastType.Series);
```

### AutoFixture Integration
AutoFixture automatically generates test data with realistic values:

```csharp
private static readonly Fixture _fixture = new();

// Customize entity creation
_fixture.Customize<Book>(c => c
    .Without(x => x.Id)
    .Do(x => x.Id = Guid.NewGuid()));
```

## Mocking Strategy

### Backend Mocking
Use Moq for dependency injection mocking:

```csharp
private readonly Mock<IApplicationDbContext> _mockContext;
private readonly Mock<ILogger<BookService>> _mockLogger;

// Setup mocks
_mockContext.Setup(c => c.Books).Returns(_mockBooks.Object);
_mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
    .ReturnsAsync(1);
```

### Frontend Mocking
Mock API clients and external dependencies:

```javascript
// Mock API client
const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Mock router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));
```

## Coverage Goals

### Backend Coverage Targets
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%

### Frontend Coverage Targets
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%

## Troubleshooting

### Common Backend Test Issues

#### 1. Database Connection Issues
```bash
# Error: Cannot connect to database
# Solution: Ensure test database is properly configured
```

**Fix**: Check that in-memory database is configured in `WebApplicationFactory`:
```csharp
services.AddDbContext<MediaLibraryDbContext>(options =>
{
    options.UseInMemoryDatabase("TestDatabase");
});
```

#### 2. Mock Setup Issues
```bash
# Error: Mock not returning expected values
# Solution: Verify mock setup and method signatures
```

**Fix**: Ensure mock setup matches actual method signatures:
```csharp
_mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
    .ReturnsAsync(1);
```

#### 3. Entity Framework Issues
```bash
# Error: Entity not tracked
# Solution: Ensure proper DbSet mocking
```

**Fix**: Use proper IQueryable mocking for DbSet:
```csharp
_mockBooks.As<IQueryable<Book>>()
    .Setup(m => m.Provider).Returns(queryableBooks.Provider);
```

### Common Frontend Test Issues

#### 1. Component Rendering Issues
```bash
# Error: Component not rendering
# Solution: Check test setup and providers
```

**Fix**: Ensure components are wrapped with necessary providers:
```javascript
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};
```

#### 2. Async Operation Issues
```bash
# Error: Async operations not completing
# Solution: Use proper async/await patterns
```

**Fix**: Use `waitFor` for async operations:
```javascript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

#### 3. Mock API Issues
```bash
# Error: API calls not mocked properly
# Solution: Verify mock setup and API client configuration
```

**Fix**: Ensure API client is properly mocked:
```javascript
jest.mock('../services/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn()
}));
```

## Debugging Tests

### Backend Debugging
```powershell
# Run specific test with detailed output
dotnet test --filter "FullyQualifiedName~BookServiceTests" --verbosity detailed

# Run with debugger
dotnet test --logger "console;verbosity=detailed" --settings runsettings.xml
```

### Frontend Debugging
```bash
# Run specific test file
npm test -- AddMediaForm.test.jsx

# Run with debug output
npm test -- --verbose

# Run in watch mode for development
npm test -- --watch
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0'
      - name: Restore dependencies
        run: dotnet restore
      - name: Run backend tests
        run: dotnet test --collect:"XPlat Code Coverage"
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install frontend dependencies
        run: cd frontend && npm install
      - name: Run frontend tests
        run: cd frontend && npm run test:run
```

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Follow the pattern: `MethodName_ShouldExpectedBehavior_WhenCondition`

### 2. Test Structure
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests focused on a single behavior
- Use meaningful assertions

### 3. Test Data
- Use consistent test data through factories
- Avoid hardcoded values in tests
- Create realistic test scenarios

### 4. Mocking
- Mock external dependencies only
- Verify mock interactions when important
- Keep mocks simple and focused

### 5. Coverage
- Aim for high coverage but focus on critical paths
- Don't test trivial getters/setters
- Test error conditions and edge cases

## Performance Considerations

### Backend Tests
- Use in-memory database for integration tests
- Clean up test data between tests
- Avoid external API calls in tests

### Frontend Tests
- Mock external dependencies
- Use shallow rendering when possible
- Avoid testing implementation details

## Maintenance

### Regular Tasks
1. **Weekly**: Run full test suite
2. **Before commits**: Run relevant tests
3. **Monthly**: Review and update test coverage
4. **Quarterly**: Refactor and optimize tests

### Test Updates
- Update tests when changing business logic
- Add tests for new features
- Remove obsolete tests
- Refactor tests for better maintainability

## Resources

### Documentation
- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [FluentAssertions Documentation](https://fluentassertions.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)

### Tools
- **Backend**: xUnit, Moq, FluentAssertions, AutoFixture
- **Frontend**: Vitest, React Testing Library, Jest DOM
- **Coverage**: Coverlet (Backend), Vitest Coverage (Frontend)

### Test Logs Storage in ProjectLoopbreaker
Based on my analysis of your project structure and test scripts, here's where test logs are stored:
Primary Log Storage Location:
Log File Types:
1. Master Test Logs:
Pattern: test-results-master-YYYY-MM-DD_HH-mm-ss.log
Content: Combined results from both backend and frontend tests
Generated by: run-all-tests.ps1
2. Backend Test Logs:
Pattern: test-results-backend-YYYY-MM-DD_HH-mm-ss.log
Content: Unit tests, integration tests, and coverage results
Generated by: run-backend-tests.ps1
3. Frontend Test Logs:
Pattern: test-results-frontend-YYYY-MM-DD_HH-mm-ss.log
Content: Vitest unit tests and coverage results
Generated by: run-frontend-tests.ps1
Additional Test Artifacts:
4. Test Result Files (.trx):
Location: tests/ directory
Pattern: {TestType}-results-{timestamp}.trx
Content: XML test results for Visual Studio integration
5. Coverage Reports:
Backend: tests/TestResults/ directory
Frontend: frontend/coverage/ directory
Format: HTML and XML coverage reports
How to View Test Logs:
Using the built-in viewer:
Direct file access:
Log Content Includes:
✅ Test execution timestamps
✅ Pass/fail/skip counts
✅ Detailed error messages for failed tests
✅ Coverage statistics
✅ Test execution duration
✅ Command-line output from test runners
✅ Color-coded output for easy reading
The logging system is comprehensive and automatically creates timestamped log files for each test run, making it easy to track test history and debug issues.
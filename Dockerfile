# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy the solution file and project files (including test projects)
# All paths are relative to the Git repository root (where the Dockerfile and WORKDIR are)
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.sln src/ProjectLoopbreaker/ProjectLoopbreaker.sln
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Application/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Application/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/
COPY tests/ProjectLoopbreaker.UnitTests/*.csproj tests/ProjectLoopbreaker.UnitTests/
COPY tests/ProjectLoopbreaker.IntegrationTests/*.csproj tests/ProjectLoopbreaker.IntegrationTests/
# If you have ProjectLoopbreaker.Core.Shared, and it's also under src/ProjectLoopbreaker/, uncomment this:
# COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Core.Shared/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Core.Shared/


# Run dotnet restore for the solution file
# The path is relative to the WORKDIR /app
RUN dotnet restore src/ProjectLoopbreaker/ProjectLoopbreaker.sln

# Copy all remaining source code (after restore to leverage caching)
COPY . .

# Publish the Web.API project
# Change WORKDIR to the specific project folder for publishing
WORKDIR /app/src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
RUN dotnet publish "ProjectLoopbreaker.Web.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app/publish
# Copy only the published output from the build stage
COPY --from=build /app/publish .

# Expose the port
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "ProjectLoopbreaker.Web.API.dll"]
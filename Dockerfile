# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the solution file and restore dependencies for all projects
# This leverages Docker caching and ensures all projects are known
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.sln src/ProjectLoopbreaker/ProjectLoopbreaker.sln
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Application/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Application/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/
COPY src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/*.csproj src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/
# If you have ProjectLoopbreaker.Core.Shared, add its csproj too:
# COPY src/ProjectLoopbreaker.Core.Shared/*.csproj src/ProjectLoopbreaker.Core.Shared/

RUN dotnet restore src/ProjectLoopbreaker.sln

# Copy all source code
COPY . .

# Publish the Web.API project
WORKDIR /src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
RUN dotnet publish "ProjectLoopbreaker.Web.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port (Render often uses 10000 by default)
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "ProjectLoopbreaker.Web.API.dll"]
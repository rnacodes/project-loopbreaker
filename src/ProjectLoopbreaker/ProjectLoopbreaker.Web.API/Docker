# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the .NET solution file and restore dependencies
# This helps with Docker layer caching
COPY MyMediaLibrary.sln ./
COPY src/MyMediaLibrary.Web.API/MyMediaLibrary.Web.API.csproj ./src/MyMediaLibrary.Web.API/
COPY src/MyMediaLibrary.Application/MyMediaLibrary.Application.csproj ./src/MyMediaLibrary.Application/
COPY src/MyMediaLibrary.Domain/MyMediaLibrary.Domain.csproj ./src/MyMediaLibrary.Domain/
COPY src/MyMediaLibrary.Infrastructure/MyMediaLibrary.Infrastructure.csproj ./src/MyMediaLibrary.Infrastructure/
# And any other C# project files you have in your solution for restore below

RUN dotnet restore MyMediaLibrary.sln

# Copy all remaining source code
COPY . .

# Publish the Web.API project
WORKDIR /app/src/MyMediaLibrary.Web.API
RUN dotnet publish "MyMediaLibrary.Web.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port (Render often uses 10000 by default, but it's good practice to expose)
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "MyMediaLibrary.Web.API.dll"]
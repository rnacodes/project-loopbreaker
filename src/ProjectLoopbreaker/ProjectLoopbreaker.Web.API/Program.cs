var builder = WebApplication.CreateBuilder(args);

// Define a name for the CORS policy
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Add services to the container.

// <<< ADD THIS SECTION to register the CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // For development, allow your local React app's URL.
                          // The default for create-react-app is port 3000.
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});


builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// <<< AND THIS LINE to tell the app to use the CORS policy you defined.
// It's important to place it here, before UseAuthorization.
app.UseCors(MyAllowSpecificOrigins);

app.UseAuthorization();

app.MapControllers();

app.Run();
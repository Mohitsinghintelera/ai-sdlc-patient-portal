using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PatientPortal.Api;
using PatientPortal.Infrastructure;

namespace PatientPortal.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<PatientPortalDbContext>));
            if (descriptor is not null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<PatientPortalDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PatientPortalDbContext>();
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();
        });
    }
}

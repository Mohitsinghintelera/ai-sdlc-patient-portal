using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PatientPortal.Infrastructure;

namespace PatientPortal.Infrastructure.Extensions;

public static class DatabaseExtensions
{
    /// <summary>
    /// Initialize database with migrations and seed data
    /// </summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PatientPortalDbContext>();

        // Skip migration and seeding for non-relational providers (e.g. in-memory test databases)
        if (!dbContext.Database.IsRelational())
        {
            return;
        }

        await dbContext.Database.MigrateAsync();
        await SeedDatabaseAsync(dbContext);
    }

    /// <summary>
    /// Seed initial data into the database
    /// </summary>
    private static async Task SeedDatabaseAsync(PatientPortalDbContext context)
    {
        // Check if Users table already has data
        if (await context.Users.AnyAsync())
        {
            return;
        }

        var users = Data.SeedData.GetUsers();
        context.Users.AddRange(users);
        await context.SaveChangesAsync();
    }
}

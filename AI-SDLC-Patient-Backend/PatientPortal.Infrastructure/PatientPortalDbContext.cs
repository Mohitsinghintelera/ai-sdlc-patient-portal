using Microsoft.EntityFrameworkCore;
using PatientPortal.Domain.Entities;

namespace PatientPortal.Infrastructure;

public class PatientPortalDbContext : DbContext
{
    public PatientPortalDbContext(DbContextOptions<PatientPortalDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(builder =>
        {
            builder.HasKey(u => u.Id);
            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(254);
            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.FirstName)
                .IsRequired()
                .HasMaxLength(128);
            builder.Property(u => u.LastName)
                .HasMaxLength(128);
            builder.Property(u => u.PasswordHash)
                .IsRequired();
            builder.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(64);
            builder.Property(u => u.DateOfBirth)
                .HasColumnType("date");
        });
    }
}

using Microsoft.EntityFrameworkCore;
using PatientPortal.Application.Interfaces;
using PatientPortal.Domain.Entities;

namespace PatientPortal.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly PatientPortalDbContext _dbContext;

    public UserRepository(PatientPortalDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
    }

    public Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return _dbContext.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public Task<User?> GetByIdAsync(Guid id)
    {
        return _dbContext.Users.FindAsync(id).AsTask();
    }

    public async Task AddAsync(User user)
    {
        await _dbContext.Users.AddAsync(user);
    }

    public Task SaveChangesAsync()
    {
        return _dbContext.SaveChangesAsync();
    }
}

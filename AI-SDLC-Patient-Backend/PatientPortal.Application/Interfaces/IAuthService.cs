using PatientPortal.Application.Models.Auth;
using PatientPortal.Domain.Entities;

namespace PatientPortal.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterSuccessResponse> RegisterAsync(string fullName, string email, string password, string confirmPassword, DateOnly dateOfBirth);
    Task<AuthResponse> LoginAsync(string email, string password);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<User?> GetUserAsync(Guid userId);
}

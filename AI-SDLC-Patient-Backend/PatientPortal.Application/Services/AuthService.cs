using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PatientPortal.Application.Configuration;
using PatientPortal.Application.Exceptions;
using PatientPortal.Application.Interfaces;
using PatientPortal.Application.Models.Auth;
using PatientPortal.Application.Mappers;
using PatientPortal.Domain.Entities;

namespace PatientPortal.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly AuthSettings _settings;

    public AuthService(IUserRepository userRepository, IOptions<AuthSettings> authOptions)
    {
        _userRepository = userRepository;
        _settings = authOptions.Value;
    }

    public async Task<RegisterSuccessResponse> RegisterAsync(string fullName, string email, string password, string confirmPassword, DateOnly dateOfBirth)
    {
        if (!string.Equals(password, confirmPassword, StringComparison.Ordinal))
        {
            throw new AppException("INVALID_INPUT", "Passwords do not match.", 400);
        }

        var existingUser = await _userRepository.GetByEmailAsync(email);
        if (existingUser is not null)
        {
            throw new AppException("EMAIL_EXISTS", "Email already registered. Try login or use another email.", 409);
        }

        var (firstName, lastName) = FullNameMapper.Split(fullName);
        var user = new User
        {
            Email = email.Trim().ToLowerInvariant(),
            FirstName = firstName,
            LastName = lastName,
            PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(password),
            Role = "Patient",
            IsActive = true,
            RefreshToken = GenerateRefreshToken(),
            RefreshTokenExpiresOn = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays),
            DateOfBirth = dateOfBirth
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return new RegisterSuccessResponse
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Message = "Account created successfully"
        };
    }

    public async Task<AuthResponse> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user is null || !BCrypt.Net.BCrypt.EnhancedVerify(password, user.PasswordHash))
        {
            throw new AppException("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
        }

        if (!user.IsActive)
        {
            throw new AppException("INVALID_CREDENTIALS", "User account is not active.", 401);
        }

        user.RefreshToken = GenerateRefreshToken();
        user.RefreshTokenExpiresOn = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays);
        await _userRepository.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        if (user is null || user.RefreshTokenExpiresOn is null || user.RefreshTokenExpiresOn < DateTime.UtcNow)
        {
            throw new AppException("TOKEN_EXPIRED", "Refresh token has expired. Please login again.", 401);
        }

        user.RefreshToken = GenerateRefreshToken();
        user.RefreshTokenExpiresOn = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays);
        await _userRepository.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public Task<User?> GetUserAsync(Guid userId)
    {
        return _userRepository.GetByIdAsync(userId);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        return new AuthResponse
        {
            AccessToken = GenerateAccessToken(user),
            RefreshToken = user.RefreshToken ?? string.Empty,
            ExpiresIn = _settings.AccessTokenExpirationMinutes * 60,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                IsActive = user.IsActive,
                DateOfBirth = DateOfBirthMapper.FormatDob(user.DateOfBirth)
            }
        };
    }

    private string GenerateAccessToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpirationMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}

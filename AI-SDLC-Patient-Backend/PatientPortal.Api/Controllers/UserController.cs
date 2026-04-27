using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientPortal.Api.Exceptions;
using PatientPortal.Api.Models.Error;
using PatientPortal.Application.Interfaces;
using PatientPortal.Application.Mappers;
using PatientPortal.Application.Models.Auth;

namespace PatientPortal.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public class UserController : ControllerBase
{
    private readonly IAuthService _authService;

    public UserController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new ApiException("INVALID_TOKEN", "Invalid authentication token.", 401);
        }

        var user = await _authService.GetUserAsync(userId);
        if (user is null)
        {
            throw new ApiException("USER_NOT_FOUND", "Authenticated user was not found.", 404);
        }

        var response = new ApiResponse<UserDto>
        {
            Success = true,
            Data = new UserDto
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

        return Ok(response);
    }
}

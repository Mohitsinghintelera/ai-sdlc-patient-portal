using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using PatientPortal.Api.Exceptions;
using PatientPortal.Api.Models.Auth;
using PatientPortal.Api.Models.Error;
using PatientPortal.Application.Interfaces;
using PatientPortal.Application.Mappers;
using PatientPortal.Application.Models.Auth;
using PatientPortal.Application.Services;

namespace PatientPortal.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<RegistrationRequest> _registrationValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RefreshRequest> _refreshValidator;

    public AuthController(
        IAuthService authService,
        IValidator<RegistrationRequest> registrationValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<RefreshRequest> refreshValidator)
    {
        _authService = authService;
        _registrationValidator = registrationValidator;
        _loginValidator = loginValidator;
        _refreshValidator = refreshValidator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegistrationRequest request)
    {
        var validation = await _registrationValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var dateOfBirth = DateOfBirthMapper.ParseDob(request.DateOfBirth)!.Value;
        var result = await _authService.RegisterAsync(request.FullName, request.Email, request.Password, request.ConfirmPassword, dateOfBirth);

        var response = new ApiResponse<RegisterSuccessResponse>
        {
            Success = true,
            Data = result
        };

        return Created(string.Empty, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var validation = await _loginValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var result = await _authService.LoginAsync(request.Email, request.Password);

        var response = new ApiResponse<AuthResponse>
        {
            Success = true,
            Data = result
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var validation = await _refreshValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            throw new ValidationException(validation.Errors);
        }

        var result = await _authService.RefreshTokenAsync(request.RefreshToken);

        var response = new ApiResponse<AuthResponse>
        {
            Success = true,
            Data = result
        };

        return Ok(response);
    }
}

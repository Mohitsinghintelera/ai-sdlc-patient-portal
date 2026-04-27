using System.Net.Http.Json;
using FluentAssertions;
using PatientPortal.Api.Models.Error;
using PatientPortal.Application.Models.Auth;
using Xunit;

namespace PatientPortal.Api.Tests.Contracts;

public class AuthContractTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthContractTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task LoginAndRefresh_ReturnValidTokenContract()
    {
        var registration = new
        {
            fullName = "Jane Doe",
            email = "jane.contract@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!",
            dateOfBirth = "04-10-1990"
        };

        await _client.PostAsJsonAsync("/api/v1/auth/register", registration);

        var loginRequest = new
        {
            email = "jane.contract@example.com",
            password = "SecurePassword123!"
        };

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        if (loginResponse.StatusCode != System.Net.HttpStatusCode.OK)
        {
            Console.WriteLine(loginContent);
        }
        loginResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        loginPayload.Should().NotBeNull();
        loginPayload!.Data.Should().NotBeNull();
        loginPayload.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        loginPayload.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        loginPayload.Data.User.Should().NotBeNull();
        loginPayload.Data.User.Email.Should().Be("jane.contract@example.com");

        var refreshRequest = new { refreshToken = loginPayload.Data.RefreshToken };
        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
        refreshResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var refreshPayload = await refreshResponse.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        refreshPayload.Should().NotBeNull();
        refreshPayload!.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshPayload.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
    }
}

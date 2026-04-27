using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PatientPortal.Api.Models.Error;
using Xunit;

namespace PatientPortal.Api.Tests.Integration;

public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> RegisterAndLogin(string fullName, string email, string password, string dob)
    {
        await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName,
            email,
            password,
            confirmPassword = password,
            dateOfBirth = dob
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.AuthResponse>>();
        return loginPayload!.Data!.AccessToken;
    }

    [Fact]
    public async Task Login_ReturnsTokens_AndProtectedEndpointSucceeds()
    {
        var token = await RegisterAndLogin("Adam Token", "adam.token@example.com", "TokenPassword123!", "05-20-1985");

        token.Should().NotBeNullOrWhiteSpace();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var userResponse = await _client.GetAsync("/api/v1/users/me");
        userResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var userPayload = await userResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.UserDto>>();
        userPayload.Should().NotBeNull();
        userPayload!.Data.Should().NotBeNull();
        userPayload.Data!.Email.Should().Be("adam.token@example.com");
    }

    [Fact]
    public async Task Login_Response_IncludesDateOfBirth_FormattedMMDDYYYY()
    {
        await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Dob Login",
            email = "dob.login@example.com",
            password = "Secure1Pass!",
            confirmPassword = "Secure1Pass!",
            dateOfBirth = "03-22-1985"
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "dob.login@example.com", password = "Secure1Pass!" });

        loginResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var payload = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.AuthResponse>>();
        payload!.Data!.User.DateOfBirth.Should().Be("03-22-1985");
    }

    [Fact]
    public async Task Login_Response_DateOfBirth_MatchesRegisteredValue()
    {
        await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Match Dob",
            email = "match.dob@example.com",
            password = "Secure1Pass!",
            confirmPassword = "Secure1Pass!",
            dateOfBirth = "07-04-1992"
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "match.dob@example.com", password = "Secure1Pass!" });

        var payload = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.AuthResponse>>();
        payload!.Data!.User.DateOfBirth.Should().Be("07-04-1992");
    }

    [Fact]
    public async Task Me_Response_IncludesDateOfBirth_FormattedMMDDYYYY()
    {
        var token = await RegisterAndLogin("Me Dob", "me.dob@example.com", "Secure1Pass!", "11-30-1980");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var meResponse = await _client.GetAsync("/api/v1/users/me");
        meResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var payload = await meResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.UserDto>>();
        payload!.Data!.DateOfBirth.Should().Be("11-30-1980");
    }

    [Fact]
    public async Task Me_Response_DateOfBirth_MatchesRegisteredValue()
    {
        var token = await RegisterAndLogin("Verify Dob", "verify.dob@example.com", "Secure1Pass!", "02-14-1995");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var meResponse = await _client.GetAsync("/api/v1/users/me");
        var payload = await meResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.UserDto>>();
        payload!.Data!.DateOfBirth.Should().Be("02-14-1995");
    }
}

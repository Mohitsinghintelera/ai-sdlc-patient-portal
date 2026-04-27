using System.Net.Http.Json;
using FluentAssertions;
using PatientPortal.Api.Models.Error;
using Xunit;

namespace PatientPortal.Api.Tests.Integration;

public class RegisterIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RegisterIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_HappyPath_CreatesNewUser()
    {
        var request = new
        {
            fullName = "Sally Patient",
            email = "sally.patient@example.com",
            password = "Patient123!",
            confirmPassword = "Patient123!",
            dateOfBirth = "06-15-1988"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.RegisterSuccessResponse>>();
        payload.Should().NotBeNull();
        payload!.Success.Should().BeTrue();
        payload.Data.Should().NotBeNull();
        payload.Data!.Email.Should().Be("sally.patient@example.com");
        payload.Data.FirstName.Should().Be("Sally");
        payload.Data.LastName.Should().Be("Patient");
    }

    [Fact]
    public async Task Register_WithValidDob_PersistsDobToUserRecord()
    {
        var request = new
        {
            fullName = "Bob Dob",
            email = "bob.dob@example.com",
            password = "Patient123!",
            confirmPassword = "Patient123!",
            dateOfBirth = "03-22-1985"
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        registerResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

        var loginRequest = new { email = "bob.dob@example.com", password = "Patient123!" };
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        loginResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<PatientPortal.Application.Models.Auth.AuthResponse>>();
        loginPayload!.Data!.User.DateOfBirth.Should().Be("03-22-1985");
    }
}

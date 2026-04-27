using System.Net.Http.Json;
using FluentAssertions;
using PatientPortal.Api.Models.Error;
using PatientPortal.Application.Models.Auth;
using Xunit;

namespace PatientPortal.Api.Tests.Contracts;

public class RegisterContractTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RegisterContractTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ReturnsCreated_WithSuccessEnvelope()
    {
        var request = new
        {
            fullName = "Jane Doe",
            email = "jane.doe@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!",
            dateOfBirth = "04-10-1990"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<RegisterSuccessResponse>>();

        payload.Should().NotBeNull();
        payload!.Success.Should().BeTrue();
        payload.Error.Should().BeNull();
        payload.Data.Should().NotBeNull();
        payload.Data!.Email.Should().Be("jane.doe@example.com");
        payload.Data.FirstName.Should().Be("Jane");
        payload.Data.LastName.Should().Be("Doe");
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDateOfBirthMissing()
    {
        var request = new
        {
            fullName = "Jane Doe",
            email = "jane.missing.dob@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        payload!.Success.Should().BeFalse();
        payload.Error!.Code.Should().Be("INVALID_INPUT");
        payload.Error.Details.Should().Contain(d => d.Field == "DateOfBirth" || d.Field == "dateOfBirth");
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDateOfBirthInvalidFormat()
    {
        var request = new
        {
            fullName = "Jane Doe",
            email = "jane.badformat@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!",
            dateOfBirth = "1990-04-10"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        payload!.Error!.Code.Should().Be("INVALID_INPUT");
        payload.Error.Details.Should().Contain(d =>
            (d.Field == "DateOfBirth" || d.Field == "dateOfBirth") &&
            d.Reason.Contains("MM-DD-YYYY"));
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDateOfBirthIsFutureDate()
    {
        var future = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)).ToString("MM-dd-yyyy");
        var request = new
        {
            fullName = "Jane Doe",
            email = "jane.futuredob@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!",
            dateOfBirth = future
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        payload!.Error!.Code.Should().Be("INVALID_INPUT");
        payload.Error.Details.Should().Contain(d =>
            (d.Field == "DateOfBirth" || d.Field == "dateOfBirth") &&
            d.Reason.Contains("past date"));
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenDateOfBirthExceeds200Years()
    {
        var tooOld = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-201).ToString("MM-dd-yyyy");
        var request = new
        {
            fullName = "Jane Doe",
            email = "jane.ancient@example.com",
            password = "SecurePassword123!",
            confirmPassword = "SecurePassword123!",
            dateOfBirth = tooOld
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        payload!.Error!.Code.Should().Be("INVALID_INPUT");
        payload.Error.Details.Should().Contain(d =>
            (d.Field == "DateOfBirth" || d.Field == "dateOfBirth") &&
            d.Reason.Contains("200 years"));
    }
}

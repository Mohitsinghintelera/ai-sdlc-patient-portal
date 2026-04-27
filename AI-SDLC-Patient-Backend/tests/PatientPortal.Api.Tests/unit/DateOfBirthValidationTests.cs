using FluentAssertions;
using FluentValidation;
using PatientPortal.Api.Models.Auth;
using PatientPortal.Api.Validators;
using Xunit;

namespace PatientPortal.Api.Tests.Unit;

public class DateOfBirthValidationTests
{
    private readonly AuthRequestValidator _validator = new();

    private static RegistrationRequest ValidRequest(string dob) => new()
    {
        FullName = "Jane Doe",
        Email = "jane@example.com",
        Password = "SecurePass1!",
        ConfirmPassword = "SecurePass1!",
        DateOfBirth = dob
    };

    [Fact]
    public async Task DateOfBirth_Missing_FailsWithRequiredError()
    {
        var request = ValidRequest(string.Empty);

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth"
            && e.ErrorMessage == "dateOfBirth is required");
    }

    [Theory]
    [InlineData("1990-01-15")]
    [InlineData("not-a-date")]
    [InlineData("15-01-1990")]
    [InlineData("01/15/1990")]
    public async Task DateOfBirth_InvalidFormat_FailsWithFormatError(string dob)
    {
        var request = ValidRequest(dob);

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth"
            && e.ErrorMessage == "dateOfBirth must be in MM-DD-YYYY format");
    }

    [Fact]
    public async Task DateOfBirth_FutureDate_FailsWithPastDateError()
    {
        var future = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var request = ValidRequest(future.ToString("MM-dd-yyyy"));

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth"
            && e.ErrorMessage == "dateOfBirth must be a past date");
    }

    [Fact]
    public async Task DateOfBirth_Today_FailsWithPastDateError()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var request = ValidRequest(today.ToString("MM-dd-yyyy"));

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth"
            && e.ErrorMessage == "dateOfBirth must be a past date");
    }

    [Fact]
    public async Task DateOfBirth_MoreThan200YearsAgo_FailsWithAgeError()
    {
        var tooOld = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-201);
        var request = ValidRequest(tooOld.ToString("MM-dd-yyyy"));

        var result = await _validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth"
            && e.ErrorMessage == "dateOfBirth must be within the last 200 years");
    }

    [Fact]
    public async Task DateOfBirth_Exactly200YearsAgo_PassesValidation()
    {
        var exactly200 = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-200);
        var request = ValidRequest(exactly200.ToString("MM-dd-yyyy"));

        var result = await _validator.ValidateAsync(request);

        result.Errors.Should().NotContain(e => e.PropertyName == "DateOfBirth");
    }

    [Fact]
    public async Task DateOfBirth_ValidPastDate_PassesValidation()
    {
        var request = ValidRequest("01-15-1990");

        var result = await _validator.ValidateAsync(request);

        result.Errors.Should().NotContain(e => e.PropertyName == "DateOfBirth");
    }
}

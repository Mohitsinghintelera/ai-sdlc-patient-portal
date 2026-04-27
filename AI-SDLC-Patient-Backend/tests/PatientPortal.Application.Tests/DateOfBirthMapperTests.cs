using FluentAssertions;
using PatientPortal.Application.Mappers;
using Xunit;

namespace PatientPortal.Application.Tests;

public class DateOfBirthMapperTests
{
    [Fact]
    public void FormatDob_WithValidDate_ReturnsMMDDYYYYString()
    {
        var dob = new DateOnly(1990, 1, 15);

        var result = DateOfBirthMapper.FormatDob(dob);

        result.Should().Be("01-15-1990");
    }

    [Fact]
    public void FormatDob_WithNull_ReturnsNull()
    {
        var result = DateOfBirthMapper.FormatDob(null);

        result.Should().BeNull();
    }

    [Fact]
    public void ParseDob_WithValidMMDDYYYYString_ReturnsCorrectDateOnly()
    {
        var result = DateOfBirthMapper.ParseDob("03-22-1985");

        result.Should().Be(new DateOnly(1985, 3, 22));
    }

    [Fact]
    public void ParseDob_WithInvalidString_ReturnsNull()
    {
        var result = DateOfBirthMapper.ParseDob("not-a-date");

        result.Should().BeNull();
    }

    [Fact]
    public void ParseDob_WithNullOrEmpty_ReturnsNull()
    {
        DateOfBirthMapper.ParseDob(null).Should().BeNull();
        DateOfBirthMapper.ParseDob(string.Empty).Should().BeNull();
    }

    [Fact]
    public void ParseDob_WithIsoFormat_ReturnsNull()
    {
        var result = DateOfBirthMapper.ParseDob("1990-01-15");

        result.Should().BeNull();
    }
}

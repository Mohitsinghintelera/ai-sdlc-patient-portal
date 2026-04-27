using System.Globalization;

namespace PatientPortal.Application.Mappers;

public static class DateOfBirthMapper
{
    private const string DisplayFormat = "MM-dd-yyyy";

    public static string? FormatDob(DateOnly? dob) =>
        dob is null ? null : dob.Value.ToString(DisplayFormat, CultureInfo.InvariantCulture);

    public static DateOnly? ParseDob(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return DateOnly.TryParseExact(raw, DisplayFormat, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var result)
            ? result
            : null;
    }
}

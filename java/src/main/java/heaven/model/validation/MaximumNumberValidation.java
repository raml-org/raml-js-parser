package heaven.model.validation;

public class MaximumNumberValidation implements Validation
{

    private Double maximum;

    public MaximumNumberValidation(String maximum)
    {
        this.maximum = parse(maximum);
    }

    public Double parse(String value)
    {
        try
        {
            return Double.parseDouble(value);
        }
        catch (NumberFormatException e)
        {
            throw new IllegalArgumentException("Cannot parse number: " + value);
        }
    }

    @Override
    public boolean check(String input)
    {
        return maximum.compareTo(parse(input)) >= 0;
    }
}

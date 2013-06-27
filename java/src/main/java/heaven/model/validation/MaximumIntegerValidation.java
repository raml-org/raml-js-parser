package heaven.model.validation;

public class MaximumIntegerValidation implements Validation
{

    private Integer maximum;

    public MaximumIntegerValidation(String maximum)
    {
        this.maximum = parse(maximum);
    }

    public Integer parse(String value)
    {
        try
        {
            return Integer.parseInt(value);
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

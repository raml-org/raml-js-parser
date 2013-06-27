package heaven.model.validation;

public class MinimumIntegerValidation implements Validation
{

    private Integer minimum;

    public MinimumIntegerValidation(String minimum)
    {
        this.minimum = parse(minimum);
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
        return minimum.compareTo(parse(input)) <= 0;
    }
}

package heaven.model.validation;

public class MinimumNumberValidation implements Validation
{

    private Double minimum;

    public MinimumNumberValidation(String minimum)
    {
        this.minimum = parse(minimum);
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
        return minimum.compareTo(parse(input)) <= 0;
    }
}

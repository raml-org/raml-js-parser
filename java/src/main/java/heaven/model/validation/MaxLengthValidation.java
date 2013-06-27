package heaven.model.validation;

public class MaxLengthValidation implements Validation
{

    private int maxLength;

    public MaxLengthValidation(int maxLength)
    {
        this.maxLength = maxLength;
    }

    @Override
    public boolean check(String input)
    {
        return input.length() <= maxLength;
    }
}

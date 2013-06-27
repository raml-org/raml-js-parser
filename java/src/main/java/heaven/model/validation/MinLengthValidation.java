package heaven.model.validation;

public class MinLengthValidation implements Validation
{

    private int minLength;

    public MinLengthValidation(int minLength)
    {
        this.minLength = minLength;
    }

    @Override
    public boolean check(String input)
    {
        return input.length() >= minLength;
    }
}

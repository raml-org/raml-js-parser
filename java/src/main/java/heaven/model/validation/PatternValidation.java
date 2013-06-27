package heaven.model.validation;

import java.util.regex.Pattern;

public class PatternValidation implements Validation
{

    private Pattern pattern;

    public PatternValidation(String pattern)
    {
        this.pattern = Pattern.compile(pattern);
    }

    @Override
    public boolean check(String input)
    {
        return pattern.matcher(input).matches();
    }
}

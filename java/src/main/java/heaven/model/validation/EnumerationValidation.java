package heaven.model.validation;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class EnumerationValidation implements Validation
{

    private Set<String> enumeration;

    public EnumerationValidation(List<String> enumeration)
    {
        if (enumeration == null)
        {
            throw new IllegalArgumentException("enumeration argument cannot be null");
        }
        this.enumeration = new HashSet<String>(enumeration);
    }

    @Override
    public boolean check(String input)
    {
        return enumeration.contains(input);
    }
}

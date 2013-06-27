package heaven.model;

import java.util.List;

import heaven.model.validation.Validation;

public class TemplateToken
{
    private String key;
    private String type;
    private List<Validation> validations;

    public TemplateToken(String key, String type, List<Validation> validations)
    {
        this.key = key;
        this.type = type;
        this.validations = validations;
    }

}

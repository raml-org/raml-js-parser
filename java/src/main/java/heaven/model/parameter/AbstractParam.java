package heaven.model.parameter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import heaven.model.ParamType;
import heaven.model.validation.EnumerationValidation;
import heaven.model.validation.MaxLengthValidation;
import heaven.model.validation.MaximumIntegerValidation;
import heaven.model.validation.MaximumNumberValidation;
import heaven.model.validation.MinLengthValidation;
import heaven.model.validation.MinimumIntegerValidation;
import heaven.model.validation.MinimumNumberValidation;
import heaven.model.validation.PatternValidation;
import heaven.model.validation.Validation;
import heaven.parser.annotation.Scalar;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AbstractParam
{

    @Scalar
    private String name;
    @Scalar
    private String description;
    @Scalar
    private ParamType type;
    private boolean required;
    private List<Validation> validations = new ArrayList<Validation>();
    private Object defaultValue;
    private Object example;

    protected final Logger logger = LoggerFactory.getLogger(getClass());


    public AbstractParam(Map<String, ?> paramDescriptor)
    {
        this.name = (String) paramDescriptor.get("name");
        this.description = (String) paramDescriptor.get("description");
        if (paramDescriptor.containsKey("type"))
        {
            this.type = ParamType.valueOf(((String) paramDescriptor.get("type")).toUpperCase());
        }
        this.required = Boolean.valueOf(String.valueOf(paramDescriptor.get("required")));
        if (paramDescriptor.containsKey("default"))
        {
            this.defaultValue = String.valueOf(paramDescriptor.get("default"));
        }
        if (paramDescriptor.containsKey("example"))
        {
            this.example = String.valueOf(paramDescriptor.get("example"));
        }
        populateValidations(paramDescriptor);
    }

    private void populateValidations(Map<String, ?> paramDescriptor)
    {
        if (paramDescriptor.containsKey("enum"))
        {
            //TODO handle multiple types
            validations.add(new EnumerationValidation((List<String>) paramDescriptor.get("enum")));
        }

        if (paramDescriptor.containsKey("pattern"))
        {
            if (type != ParamType.STRING)
            {
                throw new IllegalArgumentException("Pattern validation can only be applied to type string, not " + type);
            }
            validations.add(new PatternValidation((String) paramDescriptor.get("pattern")));
        }

        if (paramDescriptor.containsKey("minLength"))
        {
            if (type != ParamType.STRING)
            {
                throw new IllegalArgumentException("MinLength validation can only be applied to type string, not " + type);
            }
            validations.add(new MinLengthValidation((Integer) paramDescriptor.get("minLength")));
        }

        if (paramDescriptor.containsKey("maxLength"))
        {
            if (type != ParamType.STRING)
            {
                throw new IllegalArgumentException("MaxLength validation can only be applied to type string, not " + type);
            }
            validations.add(new MaxLengthValidation((Integer) paramDescriptor.get("maxLength")));
        }

        if (paramDescriptor.containsKey("minimum"))
        {
            if (type == ParamType.INTEGER)
            {
                validations.add(new MinimumIntegerValidation(String.valueOf(paramDescriptor.get("minimum"))));
            }
            else if (type == ParamType.NUMBER)
            {
                validations.add(new MinimumNumberValidation(String.valueOf(paramDescriptor.get("minimum"))));
            }
            else
            {
                throw new IllegalArgumentException("Minimum validation not allowed for type : " + type);
            }
        }

        if (paramDescriptor.containsKey("maximum"))
        {
            if (type == ParamType.INTEGER)
            {
                validations.add(new MaximumIntegerValidation(String.valueOf(paramDescriptor.get("maximum"))));
            }
            else if (type == ParamType.NUMBER)
            {
                validations.add(new MaximumNumberValidation(String.valueOf(paramDescriptor.get("maximum"))));
            }
            else
            {
                throw new IllegalArgumentException("Maximum validation not allowed for type : " + type);
            }
        }

    }


    public void setName(String name)
    {
        this.name = name;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public void setType(ParamType type)
    {
        this.type = type;
    }

    public void setRequired(boolean required)
    {
        this.required = required;
    }

    public String getName()
    {
        return name;
    }

    public String getDescription()
    {
        return description;
    }

    public ParamType getType()
    {
        return type;
    }

    public boolean isRequired()
    {
        return required;
    }

    public List<Validation> getValidations()
    {
        return validations;
    }

    public Object getDefaultValue()
    {
        return defaultValue;
    }

    public Object getExample()
    {
        return example;
    }

    public boolean validate(String value)
    {
        for (Validation validation : validations)
        {
            if (!validation.check(value))
            {
                if (logger.isInfoEnabled())
                {
                    logger.info(String.format("Validation %s failed for value %s", validation, value));
                }
                return false;
            }
        }
        return true;
    }
}

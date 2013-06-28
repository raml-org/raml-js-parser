package heaven.model;

import java.util.HashMap;
import java.util.Map;

import heaven.model.parameter.FormParameter;
import heaven.parser.annotation.Scalar;

public class MimeType
{


    private String type;
    @Scalar
    private String schema;
    @Scalar
    private String example;
    private Map<String, FormParameter> formParameters;

    public MimeType()
    {
    }

    public MimeType(String type, Map<String, ?> mimeDescriptor)
    {
        this.type = type;
        if (mimeDescriptor == null)
        {
            return;
        }

        //TODO validate not allowed fields
        if ("multipart/form-data".equals(type) ||
            "application/x-www-form-urlencoded".equals(type))
        {
            formParameters = new HashMap<String, FormParameter>();
            if (mimeDescriptor.containsKey("parameters"))
            {
                Map<String, ?> paramMap = (Map<String, ?>) mimeDescriptor.get("parameters");
                for (String key : paramMap.keySet())
                {
                    formParameters.put(key, new FormParameter((Map<String, ?>) paramMap.get(key)));
                }
            }
        }
        else
        {
            schema = (String) mimeDescriptor.get("schema");
            example = (String) mimeDescriptor.get("example");
        }
    }

    public String getType()
    {
        return type;
    }

    public void setSchema(String schema)
    {
        this.schema = schema;
    }

    public void setExample(String example)
    {
        this.example = example;
    }

    public void setFormParameters(Map<String, FormParameter> formParameters)
    {
        this.formParameters = formParameters;
    }

    public String getSchema()
    {
        return schema;
    }

    public String getExample()
    {
        return example;
    }

    public Map<String, FormParameter> getFormParameters()
    {
        //TODO throw exception if invalid type?
        return formParameters;
    }

    @Override
    public String toString()
    {
        return "MimeType{" +
               "type='" + type + '\'' +
               '}';
    }
}

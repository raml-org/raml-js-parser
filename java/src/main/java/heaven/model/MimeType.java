package heaven.model;

import java.util.HashMap;
import java.util.Map;

import heaven.model.parameter.FormParameter;

public class MimeType
{

    private String type;
    private String schema;
    private String example;
    private Map<String, FormParameter> formParameters;

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

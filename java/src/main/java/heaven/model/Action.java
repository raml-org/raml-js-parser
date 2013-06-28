package heaven.model;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import heaven.model.parameter.Header;
import heaven.model.parameter.QueryParameter;
import heaven.parser.annotation.Mapping;
import heaven.parser.annotation.Scalar;

public class Action implements Traitable
{

    @Scalar
    private String name;
    private String summary;
    private String description;
    private Map<String, Header> headers = new HashMap<String, Header>();
    private Map<String, QueryParameter> queryParameters = new HashMap<String, QueryParameter>();

    @Mapping
    private Map<String, MimeType> body = new HashMap<String, MimeType>();
    private Map<Integer, Body> responses = new HashMap<Integer, Body>();
    private Resource resource;


    public Action()
    {
    }


    public void setBody(Map<String, MimeType> body)
    {
        this.body = body;
    }

    public Map<String, QueryParameter> getQueryParameters()
    {
        return queryParameters;
    }

    public void applyTrait(Map<?, ?> actionTrait, Map<String, ?> params)
    {
        if (actionTrait.containsKey("queryParameters"))
        {
            Map traitQueryParams = (Map) actionTrait.get("queryParameters");
            for (Object queryKey : traitQueryParams.keySet())
            {
                if (!queryParameters.containsKey(queryKey))
                {
                    queryParameters.put(queryKey.toString(), new QueryParameter((Map<String, ?>) traitQueryParams.get(queryKey)));
                }
            }
        }
    }

    public String getSummary()
    {
        return summary;
    }

    public String getDescription()
    {
        return description;
    }

    public Map<String, Header> getHeaders()
    {
        return headers;
    }

    public Map<String, MimeType> getBody()
    {
        return body;
    }

    public Map<Integer, Body> getResponses()
    {
        return responses;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public Resource getResource()
    {
        return resource;
    }

    public String getName()
    {
        return name;
    }

    @Override
    public String toString()
    {
        return "Action{" +
               "name='" + name + '\'' +
               ", resource=" + resource.getUri() +
               '}';
    }
}

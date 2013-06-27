package heaven.model;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import heaven.model.parameter.Header;
import heaven.model.parameter.QueryParameter;

public class Action implements Traitable
{

    private String name;
    private String summary;
    private String description;
    private Map<String, Header> headers = new HashMap<String, Header>();
    private Map<String, QueryParameter> queryParameters = new HashMap<String, QueryParameter>();
    private Body body;
    private Map<Integer, Body> responses = new HashMap<Integer, Body>();
    private Resource resource;

    public Action(String name, Resource resource, Map actionDescriptor)
    {
        if (name == null)
        {
            throw new IllegalArgumentException("name cannot be null");
        }
        this.name = name;

        if (resource == null)
        {
            throw new IllegalArgumentException("resource cannot be null");
        }
        this.resource = resource;

        //allow null descriptor: <action> : !!null
        if (actionDescriptor == null)
        {
            return;
        }
        summary = (String) actionDescriptor.get("summary");
        description = (String) actionDescriptor.get("description");
        Map headersDescriptor = (Map) actionDescriptor.get("headers");
        if (headersDescriptor != null)
        {
            populateHeaders(headersDescriptor);
        }
        Map queryDescriptor = (Map) actionDescriptor.get("queryParameters");
        if (queryDescriptor != null)
        {
            populateQueryParams(queryDescriptor);
        }
        if (actionDescriptor.containsKey("body"))
        {
            body = new Body((Map<String, ?>) actionDescriptor.get("body"));
        }
        if (actionDescriptor.containsKey("responses"))
        {
            Map responseDescriptor = (Map) actionDescriptor.get("responses");
            for (Object key : responseDescriptor.keySet())
            {
                if (key instanceof Integer)
                {
                    Body body = new Body(null);
                    if (responseDescriptor.get(key) != null)
                    {
                        body = new Body((Map<String, ?>) ((Map) responseDescriptor.get(key)).get("body"));
                    }
                    responses.put((Integer) key, body);
                }
                else if (key instanceof List)
                {
                    Body listBody = new Body(null);
                    if (responseDescriptor.get(key) != null)
                    {
                        listBody = new Body((Map<String, ?>) ((Map) responseDescriptor.get(key)).get("body"));
                    }
                    for (Integer code : (List<Integer>) key)
                    {
                        responses.put(code, listBody);
                    }
                }
                else
                {
                    throw new IllegalArgumentException("Invalid response key : " + key);
                }
            }
        }
    }

    private void populateHeaders(Map<String, Map<String, ?>> headersDescriptor)
    {
        for (String key : headersDescriptor.keySet())
        {
            headers.put(key, new Header(headersDescriptor.get(key)));
        }
    }

    private void populateQueryParams(Map<String, Map<String, ?>> queryDescriptor)
    {
        System.out.println("queryMap = " + queryDescriptor);
        for (String key : queryDescriptor.keySet())
        {
            queryParameters.put(key, new QueryParameter(queryDescriptor.get(key)));
        }
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

    public Body getBody()
    {
        return body;
    }

    public Map<Integer, Body> getResponses()
    {
        return responses;
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

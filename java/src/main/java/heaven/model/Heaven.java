package heaven.model;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import heaven.model.parameter.UriParameter;
import heaven.parser.ParseException;
import heaven.parser.annotation.Mapping;
import heaven.parser.annotation.Scalar;
import heaven.parser.annotation.Sequence;
import heaven.parser.resolver.ResourceHandler;


public class Heaven
{

    @Scalar(required = true)
    private String title;
    @Scalar()
    private String version;
    @Scalar(rule = heaven.parser.rule.BaseUriRule.class)
    private String baseUri;
    @Mapping()
    private Map<String, UriParameter> uriParameters = new HashMap<String, UriParameter>();
    private Map<String, Trait> traits = new HashMap<String, Trait>();
    @Mapping(handler = ResourceHandler.class , implicit = true)
    private Map<String, Resource> resources = new HashMap<String, Resource>();

    @Sequence
    private List<DocumentationItem> documentation;



    private static final List<String> VALID_KEYS = Arrays.asList(
            "title", "version", "baseUri", "uriParameters", "documentation", "traits");
    private static final List<String> REQUIRED_FIELDS = Arrays.asList(
            "title", "baseUri");
    private static final int TITLE_MAX_LENGTH = 48;

    public Heaven()
    {

    }

    public void setDocumentation(List<DocumentationItem> documentation)
    {
        this.documentation = documentation;
    }

    public void setUriParameters(Map<String, UriParameter> uriParameters)
    {
        this.uriParameters = uriParameters;
    }

    public void setResources(Map<String, Resource> resources)
    {
        this.resources = resources;
    }

    private void populateUriParameters(Map<String, ?> descriptor)
    {
        for (String param : descriptor.keySet())
        {
            //TODO do proper parsing with 3rd party lib
            if (baseUri.indexOf("{" + param + "}") == -1)
            {
                throw new ParseException(String.format("Base URI (%s) does not define \"%s\" parameter",
                                                       baseUri, param));
            }
            uriParameters.put(param, new UriParameter((Map<String, ?>) descriptor.get(param)));
        }
    }

    private void validateRequiredFields(Map<String, ?> descriptor)
    {
        for (String key : REQUIRED_FIELDS)
        {
            if (!descriptor.containsKey(key))
            {
                throw new ParseException(key + " not defined");
            }
        }

        for (String key : descriptor.keySet())
        {
            if (key.startsWith("/"))
            {
                return;
            }
        }
        throw new ParseException("at least one resource must be defined");
    }

    private void checkInvalidFields(Map<String, ?> descriptor)
    {
        List<String> invalidKeys = new ArrayList<String>();
        for (String key : descriptor.keySet())
        {
            if (!key.startsWith("/") && !VALID_KEYS.contains(key))
            {
                invalidKeys.add(key);
            }
        }
        if (!invalidKeys.isEmpty())
        {
            throw new ParseException("invalid top level keys: " + invalidKeys);
        }
    }

    public String getTitle()
    {
        return title;
    }

    public void setTitle(String title)
    {
        this.title = title;
    }

    public String getVersion()
    {
        return version;
    }

    public void setVersion(String version)
    {
        this.version = version;
    }

    public String getBaseUri()
    {
        return baseUri;
    }

    public void setBaseUri(String baseUri)
    {
        this.baseUri = baseUri;
    }

    public Map<String, Trait> getTraits()
    {
        return traits;
    }

    public void addTrait(Trait trait)
    {
        traits.put(trait.getKey(), trait);
    }

    public Map<String, Resource> getResources()
    {
        return resources;
    }

    public Map<String, UriParameter> getUriParameters()
    {
        return uriParameters;
    }

    public Resource getResource(String path)
    {
        if (path.startsWith(baseUri))
        {
            path = path.substring(baseUri.length());
        }

        String baseUriPath;
        try
        {
            baseUriPath = new URL(baseUri).getPath();
        }
        catch (MalformedURLException e)
        {
            throw new RuntimeException(e); //cannot happen
        }
        if (path.startsWith(baseUriPath))
        {
            path = path.substring(baseUriPath.length());
        }

        for (Resource resource : resources.values())
        {
            if (path.startsWith(resource.getRelativeUri()))
            {
                if (path.length() == resource.getRelativeUri().length())
                {
                    return resource;
                }
                if (path.charAt(resource.getRelativeUri().length()) == '/')
                {
                    return resource.getResource(path.substring(resource.getRelativeUri().length()));
                }
            }
        }
        return null;
    }
}

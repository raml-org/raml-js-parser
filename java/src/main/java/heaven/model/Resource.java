package heaven.model;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import heaven.model.parameter.UriParameter;
import heaven.parser.ParseException;
import heaven.parser.annotation.Mapping;
import heaven.parser.annotation.Scalar;
import org.apache.commons.lang.ArrayUtils;

public class Resource
{

    @Scalar
    private String name;
    private String parentUri;
    private String relativeUri;
    private Map<String, UriParameter> uriParameters = new HashMap<String, UriParameter>();
    private ResourceMap resources = new ResourceMap();
    @Mapping(implicit = true)
    private Map<ActionType, Action> actions = new HashMap<ActionType, Action>();
    private List<?> uses = new ArrayList();

    //TODO refactor to enum in action class
    public static final String[] ACTION_NAMES = {"get", "post", "put", "delete", "head"};
    private static final List<String> VALID_KEYS;

    public Resource()
    {
    }

    static
    {
        String[] keys = (String[]) ArrayUtils.addAll(ACTION_NAMES, new String[] {"name", "uriParameters", "use"});
        VALID_KEYS = Arrays.asList(keys);
    }

    public Resource(String relativeUri, Map<String, ?> descriptor, String parentUri)
    {
        if (parentUri == null)
        {
            throw new IllegalArgumentException("parentUri cannot be null");
        }
        this.parentUri = parentUri;

        if (relativeUri == null)
        {
            throw new IllegalArgumentException("relativeUri cannot be null");
        }
        this.relativeUri = relativeUri;

        name = (String) descriptor.get("name");
        if (descriptor.containsKey("uses"))
        {
            uses = (List<?>) descriptor.get("use");
        }
        if (descriptor.containsKey("uriParameters"))
        {
            populateUriParameters((Map<String, ?>) descriptor.get("uriParameters"));
        }

        populateAction(descriptor);

        resources.populate(descriptor, this.getUri());

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

    private void populateUriParameters(Map<String, ?> descriptor)
    {
        for (String param : descriptor.keySet())
        {
            //TODO do proper parsing with 3rd party lib
            if (!relativeUri.contains("{" + param + "}"))
            {
                throw new ParseException(String.format("Relative URI (%s) does not define \"%s\" parameter",
                                                       relativeUri, param));
            }
            uriParameters.put(param, new UriParameter((Map<String, ?>) descriptor.get(param)));
        }
    }

    private void populateAction(Map descriptor)
    {

    }

    public Map<ActionType, Action> getActions()
    {
        return actions;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getName()
    {
        return name;
    }

    public String getRelativeUri()
    {
        return relativeUri;
    }

    public String getUri()
    {
        if (parentUri.endsWith("/"))
        {
            return parentUri + relativeUri.substring(1);
        }
        return parentUri + relativeUri;
    }

    public List<?> getUses()
    {
        return uses;
    }

    public Action getAction(ActionType name)
    {
        return actions.get(name);
    }

    public ResourceMap getResources()
    {
        return resources;
    }

    public Map<String, UriParameter> getUriParameters()
    {
        return uriParameters;
    }

    @Override
    public boolean equals(Object o)
    {
        if (this == o)
        {
            return true;
        }
        if (!(o instanceof Resource))
        {
            return false;
        }

        Resource resource = (Resource) o;

        return parentUri.equals(resource.parentUri) && relativeUri.equals(resource.relativeUri);

    }

    @Override
    public int hashCode()
    {
        int result = parentUri.hashCode();
        result = 31 * result + relativeUri.hashCode();
        return result;
    }

    @Override
    public String toString()
    {
        return "Resource{" +
               "name='" + name + '\'' +
               ", uri='" + getUri() + '\'' +
               '}';
    }

    public Resource getResource(String path)
    {
        for (Resource resource : resources)
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

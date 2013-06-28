package heaven.model;

import java.util.Iterator;
import java.util.Map;

import org.yaml.snakeyaml.nodes.ScalarNode;

public class Trait
{

    private String key;
    private String name;
    private Map<String, ?> defaultParams;
    private Map<?, ?> methodTemplate;

    public Trait(String key, Map description)
    {
        this.key = key;
        this.name = (String) description.get("name");
        this.defaultParams = (Map<String, ?>) description.get("requires");
        this.methodTemplate = (Map<?, ?>) description.get("provides");
    }

    public String getKey()
    {
        return key;
    }

    public String getName()
    {
        return name;
    }

    public void apply(Map<String, ?> params, Resource resource)
    {

    }

    private Iterator generateParamCombinations(Map<String, ?> mergedParams)
    {
        return new Iterator()
        {
            @Override
            public boolean hasNext()
            {
                return false;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public Object next()
            {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void remove()
            {
                throw new UnsupportedOperationException();
            }
        };
    }

    private Map<String, ?> mergeParams(Map<String, ?> useParams)
    {
        //TODO merge them
        return defaultParams;
    }
}

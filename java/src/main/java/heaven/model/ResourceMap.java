package heaven.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ResourceMap implements Iterable<Resource>
{

    private Map<String, Resource> resources = new LinkedHashMap<String, Resource>();

    public void populate(Map<String, ?> descriptor, String parentUri)
    {
        for (String key : descriptor.keySet())
        {
            if (key.startsWith("/"))
            {
                addResource(key, new Resource(key, (Map) descriptor.get(key), parentUri));
            }
        }
    }

    public void addResource(String relativePath, Resource resource)
    {
        //applyTraits(resource);
        resources.put(relativePath, resource);
    }

    //TODO recode once the spec is stabilized
    private void applyTraits(Resource resource)
    {
        for (Object traitUse : resource.getUses())
        {
            String traitKey = traitUse.toString();
            Map<String, ?> params = new HashMap<String, Object>();
            if (traitUse instanceof Map)
            {
                traitKey = ((Map) traitUse).keySet().iterator().next().toString();
                params = (Map<String, ?>) ((Map) traitUse).get(traitKey);
            }
            //traits.get(traitKey).apply(params, resource);
        }
    }

    public List<Resource> checkResourceCollision()
    {
        Set<String> resourcePaths = new HashSet<String>();
        List<Resource> collisions = new ArrayList<Resource>();
        collisions.addAll(checkResourceCollision(resourcePaths));
        return collisions;
    }

    private List<Resource> checkResourceCollision(Set<String> resourcePaths)
    {
        List<Resource> collisions = new ArrayList<Resource>();
        for (Resource resource : resources.values())
        {
            if (resourcePaths.contains(resource.getUri()))
            {
                collisions.add(resource);
            }
            else
            {
                resourcePaths.add(resource.getUri());
            }
            collisions.addAll(resource.getResources().checkResourceCollision(resourcePaths));
        }
        return collisions;
    }

    public int size()
    {
        return resources.size();
    }

    public boolean isEmpty()
    {
        return resources.isEmpty();
    }

    public Resource get(String key)
    {
        return resources.get(key);
    }

    public Iterator<Resource> iterator()
    {
        return resources.values().iterator();
    }

}

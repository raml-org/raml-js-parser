package heaven.model;

import java.util.HashMap;
import java.util.Map;

public class Body
{

    private Map<String, MimeType> mimeTypes = new HashMap<String, MimeType>();

    public Body(Map<String, ?> bodyDescriptor)
    {
        if (bodyDescriptor == null)
        {
            return;
        }
        for (String key : bodyDescriptor.keySet())
        {
            mimeTypes.put(key, new MimeType(key, (Map<String, ?>) bodyDescriptor.get(key)));
        }
    }

    public Map<String, MimeType> getMimeTypes()
    {
        return mimeTypes;
    }
}

package heaven.model.parameter;

import java.util.HashMap;
import java.util.Map;

public class UriParameter extends AbstractParam
{


    public UriParameter(Map<String, ?> descriptor)
    {
        super(descriptor);
    }

    public UriParameter()
    {
        super(new HashMap<String, Object>());
    }
}

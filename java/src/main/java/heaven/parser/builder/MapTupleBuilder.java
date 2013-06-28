package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;

import heaven.parser.resolver.DefaultScalarTupleHandler;
import org.apache.commons.beanutils.PropertyUtilsBean;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class MapTupleBuilder extends DefaultTupleBuilder<ScalarNode, MappingNode>
{

    private Class valueClass;
    private String fieldName;

    public MapTupleBuilder(String fieldName, Class valueClass)
    {
        this.fieldName = fieldName;
        this.valueClass = valueClass;
        setHandler(new DefaultScalarTupleHandler(MappingNode.class, fieldName));
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        return new PojoTupleBuilder(valueClass);
    }

    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {
        HashMap<String, Object> map = new HashMap<String, Object>();
        try
        {
            new PropertyUtilsBean().setProperty(parent, fieldName, map);
        }
        catch (IllegalAccessException e)
        {
            throw new RuntimeException(e);
        }
        catch (InvocationTargetException e)
        {
            throw new RuntimeException(e);
        }
        catch (NoSuchMethodException e)
        {
            throw new RuntimeException(e);
        }
        return map;
    }

    @Override
    public void buildKey(Object parent, ScalarNode tuple)
    {
        fieldName = tuple.getValue();
    }

}

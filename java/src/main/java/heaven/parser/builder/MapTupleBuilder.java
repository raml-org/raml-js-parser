package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;

import heaven.parser.resolver.DefaultScalarTupleHandler;
import heaven.parser.utils.ReflectionUtils;
import org.apache.commons.beanutils.PropertyUtilsBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class MapTupleBuilder extends DefaultTupleBuilder<ScalarNode, MappingNode>
{

    private Class<?> keyClass;
    private Class valueClass;
    private String keyValue;

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    public MapTupleBuilder(String keyValue, Class<?> keyClass, Class<?> valueClass)
    {
        super(new DefaultScalarTupleHandler(MappingNode.class, keyValue));
        this.keyValue = keyValue;
        this.keyClass = keyClass;
        this.valueClass = valueClass;
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        return new PojoTupleBuilder(valueClass);
    }

    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {
        final HashMap<String, Object> map = new HashMap<String, Object>();
        ReflectionUtils.setProperty(parent, keyValue, map);
        return map;
    }

    @Override
    public void buildKey(Object parent, ScalarNode tuple)
    {
        keyValue = tuple.getValue();
    }

}

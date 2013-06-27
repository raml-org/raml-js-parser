package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;

import org.apache.commons.beanutils.BeanUtils;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;


public class ScalarTupleBuilder implements TupleBuilder<ScalarNode, ScalarNode>
{

    private String fieldName;

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        return null;
    }

    @Override
    public Object buildValue(Object parent, ScalarNode node)
    {
        try
        {
            BeanUtils.setProperty(parent, fieldName, node.getValue());
        }
        catch (IllegalAccessException e)
        {
            throw new RuntimeException(e);
        }
        catch (InvocationTargetException e)
        {
            throw new RuntimeException(e);
        }
        return parent;
    }

    @Override
    public void buildKey(Object parent, ScalarNode tuple)
    {

    }


    @Override
    public boolean handles(NodeTuple touple)
    {
        if (touple.getKeyNode() instanceof ScalarNode && touple.getValueNode() instanceof ScalarNode)
        {
            return ((ScalarNode) touple.getKeyNode()).getValue().equals(fieldName);
        }
        return false;
    }
}

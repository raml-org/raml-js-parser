package heaven.parser.builder;

import java.util.Map;

import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class MappingTupleBuilder implements TupleBuilder<ScalarNode, MappingNode>
{

    private Class mappingClass;

    public MappingTupleBuilder(Class mappingClass)
    {
        this.mappingClass = mappingClass;
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        if(Map.class.isAssignableFrom(mappingClass)){
            return new DefaultTupleBuilder();
        }
        return null;
    }

    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {
        try
        {
            return mappingClass.newInstance();
        }
        catch (InstantiationException e)
        {

        }
        catch (IllegalAccessException e)
        {

        }
        return parent;
    }

    @Override
    public void buildKey(Object parent, ScalarNode tuple)
    {

    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        return false;
    }
}

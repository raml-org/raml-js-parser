package heaven.parser.builder;

import java.util.Map;

import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public class DefaultTupleBuilder<K extends Node, V extends Node> implements TupleBuilder<K, V>
{

    private Map<String, TupleBuilder> innerBuilders;

    public void setInnerBuilders(Map<String, TupleBuilder> innerBuilders)
    {
        this.innerBuilders = innerBuilders;
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        for (TupleBuilder tupleBuilder : innerBuilders.values())
        {
            if (tupleBuilder.handles(tuple))
            {
                return tupleBuilder;
            }
        }
        return new DefaultTupleBuilder();
    }

    @Override
    public Object buildValue(Object parent, V tuple)
    {

        return parent;
    }

    @Override
    public void buildKey(Object parent, K tuple)
    {

    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        return false;
    }
}

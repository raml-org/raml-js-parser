package heaven.parser.resolver;

import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class DefaultScalarTupleHandler implements TupleHandler
{


    private Class<? extends Node> value;
    private String fieldName;

    public DefaultScalarTupleHandler(Class<? extends Node> value, String fieldName)
    {
        this.value = value;
        this.fieldName = fieldName;
    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        if (tuple.getKeyNode() instanceof ScalarNode && value.isAssignableFrom(tuple.getValueNode().getClass()))
        {
            return fieldName == null || fieldName.equals(((ScalarNode) tuple.getKeyNode()).getValue());
        }
        return false;
    }
}

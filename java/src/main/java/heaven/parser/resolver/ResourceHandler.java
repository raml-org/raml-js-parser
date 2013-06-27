package heaven.parser.resolver;

import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class ResourceHandler implements TupleHandler
{

    @Override
    public boolean handles(NodeTuple tuple)
    {
        if (tuple.getKeyNode() instanceof ScalarNode)
        {
            ScalarNode keyNode = (ScalarNode) tuple.getKeyNode();
            return keyNode.getValue().startsWith("/");
        }
        else
        {
            return false;
        }
    }
}

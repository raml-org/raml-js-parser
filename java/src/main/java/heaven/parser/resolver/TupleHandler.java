package heaven.parser.resolver;

import org.yaml.snakeyaml.nodes.NodeTuple;

public interface TupleHandler
{

    boolean handles(NodeTuple tuple);
}

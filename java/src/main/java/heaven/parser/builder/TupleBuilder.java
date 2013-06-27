package heaven.parser.builder;

import heaven.parser.resolver.TupleHandler;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public interface TupleBuilder<K extends Node, V extends Node> extends TupleHandler
{

    TupleBuilder getBuiderForTuple(NodeTuple tuple);

    Object buildValue(Object parent, V tuple);

    void buildKey(Object parent, K tuple);

}

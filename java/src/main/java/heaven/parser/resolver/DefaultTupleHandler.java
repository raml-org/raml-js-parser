package heaven.parser.resolver;

import org.yaml.snakeyaml.nodes.NodeTuple;

/**
 * Created with IntelliJ IDEA.
 * User: santiagovacas
 * Date: 6/28/13
 * Time: 4:42 PM
 * To change this template use File | Settings | File Templates.
 */
public class DefaultTupleHandler implements  TupleHandler
{

    @Override
    public boolean handles(NodeTuple tuple)
    {
        return false;
    }
}

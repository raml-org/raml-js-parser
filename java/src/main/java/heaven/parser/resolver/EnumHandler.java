package heaven.parser.resolver;

import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

/**
 * Created with IntelliJ IDEA.
 * User: santiagovacas
 * Date: 6/28/13
 * Time: 4:18 PM
 * To change this template use File | Settings | File Templates.
 */
public class EnumHandler implements TupleHandler
{


    private Class<? extends Node> value;
    private Class<? extends Enum> enumClass;

    public EnumHandler(Class<? extends Node> tupleValueType, Class<? extends Enum> enumClass)
    {
        this.value = tupleValueType;
        this.enumClass = enumClass;
    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        if (tuple.getKeyNode() instanceof ScalarNode && value.isAssignableFrom(tuple.getValueNode().getClass()))
        {
            String enumValue = ((ScalarNode) tuple.getKeyNode()).getValue();
            try
            {
                Enum anEnum = Enum.valueOf(enumClass, enumValue.toUpperCase());
            }
            catch (IllegalArgumentException e)
            {
                return false;
            }
            return true;
        }
        return false;
    }
}

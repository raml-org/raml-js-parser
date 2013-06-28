package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;

import org.apache.commons.beanutils.BeanUtils;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class PojoTupleBuilder extends DefaultTupleBuilder<ScalarNode, MappingNode>
{

    private Class<?> pojoClass;
    private String fieldName;

    public PojoTupleBuilder(Class<?> pojoClass)
    {
        this.pojoClass = pojoClass;
        addBuildersFor(pojoClass);
    }


    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {
        try
        {
            Object newValue = pojoClass.newInstance();
            BeanUtils.setProperty(parent, fieldName, newValue);
            return newValue;
        }
        catch (InstantiationException e)
        {
            throw new RuntimeException(e);
        }
        catch (IllegalAccessException e)
        {
            throw new RuntimeException(e);
        }
        catch (InvocationTargetException e)
        {
            throw new RuntimeException(e);
        }

    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        return true;
    }

    @Override
    public void buildKey(Object parent, ScalarNode node)
    {
        fieldName = node.getValue();
    }
}

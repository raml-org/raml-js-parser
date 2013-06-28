package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;

import heaven.parser.resolver.DefaultScalarTupleHandler;
import org.apache.commons.beanutils.PropertyUtilsBean;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

public class PojoTupleBuilder extends DefaultTupleBuilder<ScalarNode, MappingNode>
{

    private Class<?> pojoClass;
    private String fieldName;

    public PojoTupleBuilder(String fieldName, Class<?> pojoClass)
    {
        this.pojoClass = pojoClass;
        setHandler(new DefaultScalarTupleHandler(MappingNode.class, fieldName));
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        if (builders.isEmpty())     //Do it lazzy so it support recursive structures
        {
            addBuildersFor(pojoClass);
        }
        return super.getBuiderForTuple(tuple);
    }

    public PojoTupleBuilder(Class<?> pojoClass)
    {
        this(null, pojoClass);
    }


    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {
        try
        {
            Object newValue = pojoClass.newInstance();
            new PropertyUtilsBean().setProperty(parent, fieldName, newValue);

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
        catch (NoSuchMethodException e)
        {
            throw new RuntimeException(e);
        }

    }


    @Override
    public void buildKey(Object parent, ScalarNode node)
    {
        fieldName = node.getValue();
    }
}

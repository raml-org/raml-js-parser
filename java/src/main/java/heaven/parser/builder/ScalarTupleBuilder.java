package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;

import heaven.parser.resolver.DefaultScalarTupleHandler;
import org.apache.commons.beanutils.ConvertUtils;
import org.apache.commons.beanutils.PropertyUtilsBean;
import org.yaml.snakeyaml.nodes.ScalarNode;


public class ScalarTupleBuilder extends DefaultTupleBuilder<ScalarNode, ScalarNode>
{

    private String fieldName;
    private Class<?> type;


    public ScalarTupleBuilder(String field, Class<?> type)
    {
        super(new DefaultScalarTupleHandler(ScalarNode.class, field));
        fieldName = field;
        this.type = type;

    }


    @Override
    public Object buildValue(Object parent, ScalarNode node)
    {
        try
        {
            String value = node.getValue();
            Object converted;
            if (type.isEnum())
            {
                converted = Enum.valueOf((Class) type, value.toUpperCase());
            }
            else
            {
                converted = ConvertUtils.convert(value, type);
            }
            new PropertyUtilsBean().setProperty(parent, fieldName, converted);
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
        return parent;
    }


}

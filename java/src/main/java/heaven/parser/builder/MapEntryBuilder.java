package heaven.parser.builder;

import java.lang.reflect.InvocationTargetException;
import java.util.Map;

import heaven.parser.resolver.DefaultScalarTupleHandler;
import heaven.parser.utils.ConvertUtils;
import org.apache.commons.beanutils.PropertyUtilsBean;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.ScalarNode;

/**
 * Created with IntelliJ IDEA.
 * User: santiagovacas
 * Date: 6/28/13
 * Time: 3:18 PM
 * To change this template use File | Settings | File Templates.
 */
public class MapEntryBuilder extends DefaultTupleBuilder<ScalarNode, MappingNode>
{

    private String fieldName;

    private String keyValue;
    private Class<?> keyClass;
    private Class valueClass;


    public MapEntryBuilder(String fieldName, Class<?> keyClass, Class<?> valueClass)
    {
        super(new DefaultScalarTupleHandler(MappingNode.class, fieldName));
        this.fieldName = fieldName;
        this.keyClass = keyClass;
        this.valueClass = valueClass;
        addBuildersFor(valueClass);
    }

    @Override
    public Object buildValue(Object parent, MappingNode tuple)
    {

        Map actualParent;
        try
        {
            actualParent = (Map) new PropertyUtilsBean().getProperty(parent, fieldName);
            Object newValue = valueClass.newInstance();
            actualParent.put(ConvertUtils.convertTo(keyValue, keyClass), newValue);
            return newValue;
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
        catch (InstantiationException e)
        {
            throw new RuntimeException(e);
        }

    }

    @Override
    public void buildKey(Object parent, ScalarNode tuple)
    {
        keyValue = tuple.getValue();
    }
}

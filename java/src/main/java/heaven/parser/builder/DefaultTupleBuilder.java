package heaven.parser.builder;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import heaven.parser.annotation.Mapping;
import heaven.parser.annotation.Scalar;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public class DefaultTupleBuilder<K extends Node, V extends Node> implements TupleBuilder<K, V>
{

    private Map<String, TupleBuilder<?, ?>> builders;
    private TupleBuilder parent;

    public DefaultTupleBuilder()
    {
        builders = new HashMap<String, TupleBuilder<?, ?>>();
    }

    @Override
    public TupleBuilder getBuiderForTuple(NodeTuple tuple)
    {
        for (TupleBuilder tupleBuilder : builders.values())
        {
            if (tupleBuilder.handles(tuple))
            {
                return tupleBuilder;
            }
        }
        return new DefaultTupleBuilder();
    }

    @Override
    public Object buildValue(Object parent, V tuple)
    {

        return parent;
    }

    @Override
    public void buildKey(Object parent, K tuple)
    {

    }

    @Override
    public void setParentTupleBuilder(TupleBuilder tupleBuilder)
    {
        parent = tupleBuilder;
    }

    @Override
    public void setNestedBuilders(Map<String, TupleBuilder<?, ?>> nestedBuilders)
    {
        builders = nestedBuilders;
    }


    public void addBuildersFor(Class<?> documentClass)
    {
        Field[] declaredFields = documentClass.getDeclaredFields();
        Map<String, TupleBuilder<?, ?>> innerBuilders = new HashMap<String, TupleBuilder<?, ?>>();
        for (Field declaredField : declaredFields)
        {
            Scalar scalar = declaredField.getAnnotation(Scalar.class);
            Mapping mapping = declaredField.getAnnotation(Mapping.class);
            TupleBuilder tupleBuilder = null;
            if (scalar != null)
            {

                if (scalar.builder() != TupleBuilder.class)
                {
                    tupleBuilder = createCustomBuilder(scalar);
                }
                else
                {
                    tupleBuilder = new ScalarTupleBuilder(declaredField.getName());
                }

            }
            else if (mapping != null)
            {
                if (mapping.builder() != TupleBuilder.class)
                {
                    tupleBuilder = createCustomBuilder(scalar);
                }
                else
                {
                    //TODO CHECK THIS!!!
                    tupleBuilder = new MapTupleBuilder(declaredField.getName(), documentClass);
                }
            }
            if (tupleBuilder != null)
            {
                tupleBuilder.setParentTupleBuilder(this);
                innerBuilders.put(declaredField.getName(), tupleBuilder);
            }
        }
        setNestedBuilders(innerBuilders);
    }

    private TupleBuilder createCustomBuilder(Scalar scalar)
    {
        TupleBuilder tupleBuilder;
        try
        {
            tupleBuilder = scalar.builder().newInstance();
        }
        catch (InstantiationException e)
        {
            throw new RuntimeException(e);
        }
        catch (IllegalAccessException e)
        {
            throw new RuntimeException(e);
        }
        return tupleBuilder;
    }

    @Override
    public boolean handles(NodeTuple tuple)
    {
        return false;
    }
}

package heaven.parser.builder;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import heaven.parser.annotation.Mapping;
import heaven.parser.annotation.Scalar;
import heaven.parser.resolver.TupleHandler;
import heaven.parser.utils.ReflectionUtils;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public class DefaultTupleBuilder<K extends Node, V extends Node> implements TupleBuilder<K, V>
{

    protected Map<String, TupleBuilder<?, ?>> builders;
    private TupleBuilder parent;
    private TupleHandler handler;

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

    public void setHandler(TupleHandler handler)
    {
        this.handler = handler;
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
        List<Field> declaredFields = ReflectionUtils.getInheritedFields(documentClass);
        Map<String, TupleBuilder<?, ?>> innerBuilders = new HashMap<String, TupleBuilder<?, ?>>();
        for (Field declaredField : declaredFields)
        {
            Scalar scalar = declaredField.getAnnotation(Scalar.class);
            Mapping mapping = declaredField.getAnnotation(Mapping.class);
            TupleBuilder tupleBuilder = null;
            TupleHandler tupleHandler = null;
            if (scalar != null)
            {

                if (scalar.builder() != TupleBuilder.class)
                {
                    tupleBuilder = createCustomBuilder(scalar.builder());
                }
                else
                {
                    tupleBuilder = new ScalarTupleBuilder(declaredField.getName(), declaredField.getType());
                }
                if (scalar.handler() != TupleHandler.class)
                {
                    tupleHandler = createHandler(scalar.handler());
                }

            }
            else if (mapping != null)
            {
                if (mapping.builder() != TupleBuilder.class)
                {
                    tupleBuilder = createCustomBuilder(mapping.builder());
                }
                else
                {
                    if (Map.class.isAssignableFrom(declaredField.getType()))
                    {
                        Type type = declaredField.getGenericType();
                        if (type instanceof ParameterizedType)
                        {
                            ParameterizedType pType = (ParameterizedType) type;
                            Type valueType = pType.getActualTypeArguments()[1];
                            if (valueType instanceof Class<?>)
                            {
                                tupleBuilder = new MapTupleBuilder(declaredField.getName(), (Class) valueType);
                            }
                        }
                    }
                    else
                    {
                        tupleBuilder = new PojoTupleBuilder(declaredField.getName(), declaredField.getDeclaringClass());
                    }
                }

                if (mapping.handler() != TupleHandler.class)
                {
                    tupleHandler = createHandler(mapping.handler());
                }
            }
            if (tupleBuilder != null)
            {
                if (tupleHandler != null)
                {
                    tupleBuilder.setHandler(tupleHandler);
                }
                tupleBuilder.setParentTupleBuilder(this);
                innerBuilders.put(declaredField.getName(), tupleBuilder);
            }
        }
        setNestedBuilders(innerBuilders);
    }

    private TupleHandler createHandler(Class<? extends TupleHandler> handler)
    {
        try
        {
            return handler.newInstance();
        }
        catch (InstantiationException e)
        {
            throw new RuntimeException(e);
        }
        catch (IllegalAccessException e)
        {
            throw new RuntimeException(e);
        }
    }


    private TupleBuilder createCustomBuilder(Class<? extends TupleBuilder> builder)
    {
        TupleBuilder tupleBuilder;
        try
        {

            tupleBuilder = builder.newInstance();
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
        return handler != null ? handler.handles(tuple) : false;
    }

    public TupleBuilder getParent()
    {
        return parent;
    }
}

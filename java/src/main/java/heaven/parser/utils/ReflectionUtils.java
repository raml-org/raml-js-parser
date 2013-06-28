package heaven.parser.utils;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.beanutils.PropertyUtilsBean;

public class ReflectionUtils
{

    public static List<Field> getInheritedFields(Class<?> type)
    {
        List<Field> fields = new ArrayList<Field>();
        for (Class<?> c = type; c != null; c = c.getSuperclass())
        {
            fields.addAll(Arrays.asList(c.getDeclaredFields()));
        }
        return fields;
    }


    public static void setProperty(Object parent, String fieldName, Object value)
    {
        if (parent instanceof List && fieldName == null)
        {
            ((List) parent).add(value);
        }
        else
        {
            try
            {
                new PropertyUtilsBean().setProperty(parent, fieldName, value);
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
    }
}

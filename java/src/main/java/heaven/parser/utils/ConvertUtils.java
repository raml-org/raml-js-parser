package heaven.parser.utils;

/**
 * Created with IntelliJ IDEA.
 * User: santiagovacas
 * Date: 6/28/13
 * Time: 3:56 PM
 * To change this template use File | Settings | File Templates.
 */
public class ConvertUtils
{

    public static <T> T convertTo(String value, Class<T> type)
    {
        if (type.isEnum())
        {
            return type.cast(Enum.valueOf((Class) type, value.toUpperCase()));
        }
        else
        {
            return type.cast(org.apache.commons.beanutils.ConvertUtils.convert(value, type));
        }
    }

}

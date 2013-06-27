package heaven.parser.rule;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.yaml.snakeyaml.nodes.ScalarNode;

public class BaseUriRule extends SimpleRule
{

    public static final String URI_NOT_VALID_MESSAGE = "The baseUri element is not a valid URI";
    public static final String VERSION_NOT_PRESENT_MESSAGE = "version parameter must exist in the API definition";

    private static final String URI_PATTERN = "[.*]?\\{(\\w+)?\\}[.*]*";
    private String baseUri;
    private Set<String> parameters;
    private Pattern pattern;


    public BaseUriRule()
    {
        super("baseUri", true);

        parameters = new HashSet<String>();
        pattern = Pattern.compile(URI_PATTERN);

    }

    public String getBaseUri()
    {
        return baseUri;
    }

    public Set<String> getParameters()
    {
        return parameters;
    }


    @Override
    public List<ValidationResult> validateValue(ScalarNode node)
    {
        String value = node.getValue();
        Matcher matcher = pattern.matcher(value);
        List<ValidationResult> validationResults = new ArrayList<ValidationResult>();
        while (matcher.find())
        {
            String paramValue = matcher.group(1);
            value = value.replace("{" + paramValue + "}", "temp");
            parameters.add(paramValue);
        }
        if (getVersionRule().getKeyNode() == null && parameters.contains(getVersionRule().getRuleName()))
        {
            validationResults.add(ValidationResult.createErrorResult(VERSION_NOT_PRESENT_MESSAGE, node.getStartMark(), node.getEndMark()));
        }
        if (!isValid(value))
        {
            validationResults.add(ValidationResult.createErrorResult(URI_NOT_VALID_MESSAGE, getKeyNode().getStartMark(), getKeyNode().getEndMark()));
        }
        validationResults.addAll(super.validateValue(node));
        if (ValidationResult.areValids(validationResults))
        {
            baseUri = node.getValue();
        }
        return validationResults;
    }

    private boolean isValid(String value)
    {
        try
        {
            new URL(value);
            return true;
        }
        catch (MalformedURLException e)
        {
            return false;
        }
    }

    public SimpleRule getVersionRule()
    {
        return (SimpleRule) getParent().getRuleByFieldName("version");
    }


}

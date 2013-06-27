package heaven.parser.rule;

import java.util.ArrayList;
import java.util.List;

import org.yaml.snakeyaml.nodes.ScalarNode;


public class EnumSimpleRule extends SimpleRule
{

    private List<String> validTypes;

    public EnumSimpleRule(String ruleName, boolean required, List<String> validTypes)
    {
        super(ruleName, required);
        this.setValidTypes(validTypes);
    }

    @Override
    public List<ValidationResult> validateValue(ScalarNode node)
    {
        String value = node.getValue();
        List<ValidationResult> validationResults = new ArrayList<ValidationResult>();
        if (!getValidTypes().contains(value))
        {
            validationResults.add(ValidationResult.createErrorResult("Invalid " + getRuleName() + " " + value, node.getStartMark(), node.getEndMark()));
        }
        validationResults.addAll(super.validateValue(node));
        if (ValidationResult.areValids(validationResults))
        {
            setValueNode(node);
        }
        return validationResults;
    }

    public List<String> getValidTypes()
    {
        return validTypes;
    }

    public void setValidTypes(List<String> validTypes)
    {
        this.validTypes = validTypes;
    }
}

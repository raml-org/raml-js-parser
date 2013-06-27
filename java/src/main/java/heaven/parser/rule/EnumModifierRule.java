package heaven.parser.rule;

import java.util.ArrayList;
import java.util.List;

import org.yaml.snakeyaml.nodes.ScalarNode;


public class EnumModifierRule extends SimpleRule
{

    private EnumSimpleRule enumRule;
    private List<String> enumTypes;

    public EnumModifierRule(String ruleName, List<String> enumTypes, EnumSimpleRule enumRule)
    {
        super(ruleName, false);
        this.enumTypes = enumTypes;
        this.enumRule = enumRule;
    }

    @Override
    public List<ValidationResult> validateKey(ScalarNode key)
    {
        ScalarNode enumValueNode = enumRule.getValueNode();
        List<ValidationResult> validationResults = new ArrayList<ValidationResult>();
        String messageTypes = generateMessageTypes(enumTypes, enumRule);
        if (enumValueNode == null)
        {
            validationResults.add(ValidationResult.createErrorResult(enumRule.getRuleName() + " must exist first, and it must be of type" + messageTypes, key.getStartMark(), key.getEndMark()));
        }
        if (enumValueNode != null && !enumTypes.contains(enumRule.getValueNode().getValue()))
        {
            validationResults.add(ValidationResult.createErrorResult(enumRule.getRuleName() + " must be of type" + messageTypes, key.getStartMark(), key.getEndMark()));
        }
        validationResults.addAll(super.validateKey(key));
        if (ValidationResult.areValids(validationResults))
        {
            setKeyNode(key);
        }
        return validationResults;
    }

    private String generateMessageTypes(List<String> enumTypes2, EnumSimpleRule enumRule2)
    {
        StringBuilder types = new StringBuilder();
        for (int i = 0; i < enumTypes.size() - 1; i++)
        {
            types.append(" " + enumTypes.get(i) + " or");
        }
        types.append(" " + enumTypes.get(enumTypes.size() - 1));
        return types.toString();
    }

    @Override
    public List<ValidationResult> validateValue(ScalarNode node)
    {
        String valueNode = node.getValue();
        List<ValidationResult> validationResults = new ArrayList<ValidationResult>();
        try
        {
            Integer.parseInt(valueNode);
        }
        catch (NumberFormatException nfe)
        {
            validationResults.add(ValidationResult.createErrorResult(getRuleName() + " can only contain integer values greater than zero", node.getStartMark(), node.getEndMark()));
        }
        validationResults.addAll(super.validateValue(node));
        return validationResults;
    }
}

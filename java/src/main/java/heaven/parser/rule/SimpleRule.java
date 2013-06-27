package heaven.parser.rule;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;


public class SimpleRule extends DefaultTupleRule<ScalarNode, ScalarNode>
{

    private String ruleName;
    private static final String EMPTY_MESSAGE = "can not be empty";
    private static final String DUPLICATE_MESSAGE = "Duplicate";
    private static final String IS_MISSING = "is missing";
    private ScalarNode keyNode;
    private ScalarNode valueNode;
    private boolean required;

    public SimpleRule(String ruleName, boolean required)
    {
        this.setRuleName(ruleName);
        this.setRequired(required);
    }

    @Override
    public boolean handles(NodeTuple touple)
    {
        if (touple.getKeyNode() instanceof ScalarNode && touple.getValueNode() instanceof ScalarNode)
        {
            return ((ScalarNode) touple.getKeyNode()).getValue().equals(ruleName);
        }
        return false;
    }

    public static String getRuleEmptyMessage(String ruleName)
    {
        return ruleName + " " + EMPTY_MESSAGE;
    }

    public static String getDuplicateRuleMessage(String ruleName)
    {
        return DUPLICATE_MESSAGE + " " + ruleName;
    }

    public static String getMissingRuleMessage(String ruleName)
    {
        return ruleName + " " + IS_MISSING;
    }

    public String getRuleName()
    {
        return ruleName;
    }

    public void setRuleName(String ruleName)
    {
        this.ruleName = ruleName;
    }

    @Override
    public List<ValidationResult> onRuleEnd()
    {
        if (isRequired())
        {
            return wasAlreadyDefined() ? Collections.<ValidationResult>emptyList() : Arrays.asList(ValidationResult.createErrorResult(getMissingRuleMessage(ruleName)));
        }
        return Collections.<ValidationResult>emptyList();
    }

    @Override
    public List<ValidationResult> validateKey(ScalarNode key)
    {
        if (wasAlreadyDefined())
        {
            return Arrays.<ValidationResult>asList(ValidationResult.createErrorResult(getDuplicateRuleMessage(ruleName), key.getStartMark(), key.getEndMark()));
        }
        setKeyNode(key);
        return super.validateKey(key);
    }

    @Override
    public List<ValidationResult> validateValue(ScalarNode node)
    {
        String value = node.getValue();
        if (StringUtils.isEmpty(value))
        {
            return Arrays.<ValidationResult>asList(ValidationResult.createErrorResult(getRuleEmptyMessage(ruleName), keyNode.getStartMark(), keyNode.getEndMark()));
        }
        setValueNode(node);
        return super.validateValue(node);
    }

    public boolean wasAlreadyDefined()
    {
        return keyNode != null;
    }

    public void setKeyNode(ScalarNode rulePresent)
    {
        this.keyNode = rulePresent;
    }

    public ScalarNode getKeyNode()
    {
        return keyNode;
    }

    public boolean isRequired()
    {
        return required;
    }

    public void setRequired(boolean required)
    {
        this.required = required;
    }

    public ScalarNode getValueNode()
    {
        return valueNode;
    }

    public void setValueNode(ScalarNode valueNode)
    {
        this.valueNode = valueNode;
    }

}

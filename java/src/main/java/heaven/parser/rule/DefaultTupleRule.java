package heaven.parser.rule;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public class DefaultTupleRule<K extends Node, V extends Node> implements ITupleRule<K, V>
{

    private Map<String, ? extends ITupleRule<?, ?>> rules;
    private ITupleRule<?, ?> parent;

    public DefaultTupleRule()
    {
        rules = new HashMap<String, ITupleRule<?, ?>>();
    }

    public void setNestedRules(Map<String, ? extends ITupleRule<?, ?>> rules)
    {
        this.rules = rules;
    }

    @Override
    public boolean handles(NodeTuple touple)
    {
        return true;
    }

    @Override
    public List<ValidationResult> validateKey(K key)
    {
        return Arrays.asList(ValidationResult.okResult());
    }

    @Override
    public List<ValidationResult> validateValue(V key)
    {
        return Arrays.asList(ValidationResult.okResult());
    }

    @Override
    public List<ValidationResult> onRuleEnd()
    {
        List<ValidationResult> result = new ArrayList<ValidationResult>();
        for (ITupleRule<?, ?> rule : rules.values())
        {
            List<ValidationResult> onRuleEnd = rule.onRuleEnd();
            result.addAll(onRuleEnd);
        }
        return result;
    }

    @Override
    public ITupleRule<?, ?> getRuleForTuple(NodeTuple nodeTuple)
    {
        for (ITupleRule<?, ?> rule : rules.values())
        {
            if (rule.handles(nodeTuple))
            {
                return rule;
            }
        }
        return new DefaultTupleRule<Node, Node>();
    }

    @Override
    public void setParentTupleRule(ITupleRule<?, ?> parent)
    {

        this.parent = parent;
    }

    @Override
    public ITupleRule<?, ?> getRuleByFieldName(String fieldName)
    {
        return rules.get(fieldName);
    }

    public ITupleRule<?, ?> getParent()
    {
        return parent;
    }
}
